import {
    Either,
    Left,
    Right
} from './Either';
import {
    Cmd
} from './Platform/Cmd';

abstract class InternalCmd<M> extends Cmd<M> {
    public static of<M>(callPromise: () => Promise<M>): Cmd<M> {
        return super.of(callPromise);
    }
}

type Executor<E, T> = (
    fail: (error: E) => void,
    succeed: (value: T) => void
) => void;

export abstract class Task<E, T> {
    public static succeed<T>(value: T): Task<never, T> {
        return new Succeed(value);
    }

    public static fail<E>(error: E): Task<E, never> {
        return new Fail(error);
    }

    public static props<E, T extends object>(
        config: {[ K in keyof T ]: Task<E, T[ K ]>}
    ): Task<E, T> {
        let acc: Task<E, T> = Task.succeed({} as T);

        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                acc = acc.chain(
                    (obj: T): Task<E, T> => config[ key ].map(
                        (value: T[ Extract<keyof T, string> ]): T => {
                            obj[ key ] = value;

                            return obj;
                        }
                    )
                );
            }
        }

        return acc;
    }

    public static sequence<E, T>(tasks: Array<Task<E, T>>): Task<E, Array<T>> {
        let acc: Task<E, Array<T>> = Task.succeed([]);

        for (const task of tasks) {
            acc = acc.chain(
                (arr: Array<T>): Task<E, Array<T>> => task.map(
                    (value: T): Array<T> => {
                        arr.push(value);

                        return arr;
                    }
                )
            );
        }

        return acc;
    }

    protected static of<E, T>(executor: Executor<E, T>): Task<E, T> {
        return new Cons(executor);
    }

    protected static execute<E, T>(task: Task<E, T>): Promise<T> {
        return task.execute();
    }

    public map<R>(fn: (value: T) => R): Task<E, R> {
        return new Map(fn, this);
    }

    public chain<R>(fn: (value: T) => Task<E, R>): Task<E, R> {
        return new Chain(fn, this);
    }

    public onError<S>(fn: (error: E) => Task<S, T>): Task<S, T> {
        return new OnError(fn, this);
    }

    public mapError<S>(fn: (error: E) => S): Task<S, T> {
        return new MapError(fn, this);
    }

    public attempt<M>(tagger: (either: Either<E, T>) => M): Cmd<M> {
        return InternalCmd.of(
            () => this.execute()
                .then((value: T) => tagger(Right(value)))
                .catch((error: E) => tagger(Left(error)))
        );
    }

    public perform<M>(tagger: [ E ] extends [ never ] ? (value: T) => M : never): Cmd<M> {
        return InternalCmd.of(
            () => this.execute().then(tagger)
        );
    }

    public abstract pipe<S>(
        task: T extends (value: infer A) => unknown
            ? Task<[ E ] extends [ never ] ? S : E, A>
            : never
    ): Task<[ E ] extends [ never ] ? S : E, T extends (value: unknown) => infer U ? U : T>;

    protected abstract execute(): Promise<T>;
}

abstract class Streamable<E, T> extends Task<E, T> {
    public pipe<S, A, U>(
        task: T extends (value: A) => unknown
            ? Task<[ E ] extends [ never ] ? S : E, A>
            : never
    ): Task<[ E ] extends [ never ] ? S : E, T extends (value: unknown) => U ? U : T> {
        return new Pipe(task, this as unknown as Task<
            [ E ] extends [ never ] ? S : E,
            (value: A) => T extends (value: unknown) => U ? U : T
        >);
    }

    protected abstract execute(): Promise<T>;
}

class Pipe<E, T, R> extends Streamable<E, R> {
    constructor(
        private readonly value: Task<E, T>,
        private readonly fn: Task<E, (value: T) => R>
    ) {
        super();
    }

    public execute(): Promise<R> {
        return Task.execute(this.fn).then(
            (fn: (value: T) => R): Promise<R> => Task.execute(this.value).then(fn)
        );
    }
}

class Cons<E, T> extends Streamable<E, T> {
    constructor(private readonly executor: Executor<E, T>) {
        super();
    }

    protected execute(): Promise<T> {
        return new Promise((resolve: (value: T) => void, reject: (error: E) => void): void => {
            this.executor(reject, resolve);
        });
    }
}

class Succeed<T> extends Streamable<never, T> {
    constructor(private readonly value: T) {
        super();
    }

    protected execute(): Promise<T> {
        return Promise.resolve(this.value);
    }
}

class Fail<E> extends Streamable<E, never> {
    constructor(private readonly error: E) {
        super();
    }

    protected execute<T>(): Promise<T> {
        return Promise.reject(this.error);
    }
}

class Map<E, T, R> extends Streamable<E, R> {
    constructor(
        private readonly fn: (value: T) => R,
        private readonly task: Task<E, T>
    ) {
        super();
    }

    protected execute(): Promise<R> {
        return Task.execute(this.task).then(this.fn);
    }
}

class Chain<E, T, R> extends Streamable<E, R> {
    constructor(
        private readonly fn: (value: T) => Task<E, R>,
        private readonly task: Task<E, T>
    ) {
        super();
    }

    protected execute(): Promise<R> {
        return Task.execute(this.task).then((value: T) => Task.execute(this.fn(value)));
    }
}

class OnError<E, T, S> extends Streamable<S, T> {
    constructor(
        private readonly fn: (error: E) => Task<S, T>,
        private readonly task: Task<E, T>
    ) {
        super();
    }

    protected execute(): Promise<T> {
        return Task.execute(this.task).catch((error: E): Promise<T> => Task.execute(this.fn(error)));
    }
}

class MapError<E, T, S> extends Streamable<S, T> {
    constructor(
        private readonly fn: (error: E) => S,
        private readonly task: Task<E, T>
    ) {
        super();
    }

    protected execute(): Promise<T> {
        return Task.execute(this.task).catch((error: E): Promise<T> => Promise.reject(this.fn(error)));
    }
}
