import {
    Maybe,
    Nothing,
    Just
} from './Maybe';
import {
    Either,
    Left,
    Right
} from './Either';
import {
    Cmd
} from './Platform/Cmd';
import {
    Process
} from './Process';


abstract class InternalCmd<M> extends Cmd<M> {
    public static of<M>(callPromise: () => Promise<M>): Cmd<M> {
        return super.of(callPromise);
    }
}

abstract class InternalProcess extends Process {
    public static of(abort: () => void): Process {
        return super.of(abort);
    }

    public static get none(): Process {
        return super.none;
    }
}

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

    protected static of<E, T>(
        callback: (done: (task: Task<E, T>) => void) => Process
    ): Task<E, T> {
        return new Single(callback);
    }

    protected static execute<E, T>(task: Task<E, T>): Promise<T> {
        return task.execute();
    }

    protected static getProcess<E, T>(task: Task<E, T>): Maybe<Process> {
        return task.process;
    }

    protected process: Maybe<Process> = Nothing;

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

    public abstract spawn(): Task<never, Process>;

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
}

class Pipe<E, T, R> extends Streamable<E, R> {
    constructor(
        private readonly value: Task<E, T>,
        private readonly fn: Task<E, (value: T) => R>
    ) {
        super();
    }

    public spawn(): Task<never, Process> {
        return this.fn.spawn();
    }

    public execute(): Promise<R> {
        return Task.execute(this.fn).then(
            (fn: (value: T) => R): Promise<R> => Task.execute(this.value).then(fn)
        );
    }
}

class Single<E, T> extends Streamable<E, T> {
    constructor(
        private readonly callback: (done: (task: Task<E, T>) => void) => Process
    ) {
        super();
    }

    public spawn(): Task<never, Process> {
        return Task.of((done: (task: Task<never, Process>) => void): Process => {
            this.execute();

            done(Task.succeed(this.process.getOrElse(InternalProcess.none)));

            return InternalProcess.none;
        });
    }

    protected execute(): Promise<T> {
        return new Promise((resolve: (value: T) => void, reject: (error: E) => void): void => {
            const process = this.callback((task: Task<E, T>) => {
                return Task
                    .execute(task)
                    .then(resolve, reject)
                    .then((): void => {
                        this.process = Nothing;
                    });
            });

            this.process = Just(process);
        });
    }
}

class Succeed<T> extends Streamable<never, T> {
    constructor(private readonly value: T) {
        super();
    }

    public spawn(): Task<never, Process> {
        return Task.succeed(InternalProcess.none);
    }

    protected execute(): Promise<T> {
        return Promise.resolve(this.value);
    }
}

class Fail<E> extends Streamable<E, never> {
    constructor(private readonly error: E) {
        super();
    }

    public spawn(): Task<never, Process> {
        return Task.succeed(InternalProcess.none);
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

    public spawn(): Task<never, Process> {
        return this.task.spawn();
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

    public spawn(): Task<never, Process> {
        return this.task.spawn();
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

    public spawn(): Task<never, Process> {
        return this.task.spawn();
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

    public spawn(): Task<never, Process> {
        return this.task.spawn();
    }

    protected execute(): Promise<T> {
        return Task.execute(this.task).catch((error: E): Promise<T> => Promise.reject(this.fn(error)));
    }
}
