import {
    Either,
    Left,
    Right
} from 'Either';
import {
    Cmd
} from 'Platform/Cmd';

abstract class Internal<M> extends Cmd<M> {
    public static cons<M>(callPromise: () => Promise<M>): Cmd<M> {
        return super.cons(callPromise);
    }
}

export abstract class Task<E, T> {
    public static succeed<T>(value: T): Task<any, T> {
        return new Variations.Succeed(value);
    }

    public static fail<E>(error: E): Task<E, any> {
        return new Variations.Fail(error);
    }

    public static sequence<E, T>(tasks: Array<Task<E, T>>): Task<E, Array<T>> {
        return new Variations.Sequence(tasks);
    }

    public static perform<M, T>(tagger: (value: T) => M, task: Task<never, T>): Cmd<M> {
        return Internal.cons(
            () => task.execute().then(tagger)
        );
    }

    protected static cons<E, T>(executor: (succeed: (value: T) => void, fail: (error: E) => void) => void): Task<E, T> {
        return new Variations.Cons(executor);
    }

    protected static execute<E, T>(task: Task<E, T>): Promise<T> {
        return task.execute();
    }

    public map<R>(fn: (value: T) => R): Task<E, R> {
        return new Variations.Map(fn, this);
    }

    public chain<R>(fn: (value: T) => Task<E, R>): Task<E, R> {
        return new Variations.Chain(fn, this);
    }

    public onError<S>(fn: (error: E) => Task<S, T>): Task<S, T> {
        return new Variations.OnError(fn, this);
    }

    public mapError<S>(fn: (error: E) => S): Task<S, T> {
        return new Variations.MapError(fn, this);
    }

    public attempt<M>(tagger: (either: Either<E, T>) => M): Cmd<M> {
        return Internal.cons(
            () => this.execute()
                .then((value: T) => tagger(Right(value)))
                .catch((error: E) => tagger(Left(error)))
        );
    }

    protected abstract execute(): Promise<T>;
}

namespace Variations {
    export class Cons<E, T> extends Task<E, T> {
        constructor(protected readonly executor: (succeed: (value: T) => void, fail: (error: E) => void) => void) {
            super();
        }

        protected execute(): Promise<T> {
            return new Promise(this.executor);
        }
    }

    export class Succeed<E, T> extends Task<E, T> {
        constructor(protected readonly value: T) {
            super();
        }

        protected execute(): Promise<T> {
            return Promise.resolve(this.value);
        }
    }

    export class Fail<E, T> extends Task<E, T> {
        constructor(protected readonly error: E) {
            super();
        }

        protected execute(): Promise<T> {
            return Promise.reject(this.error);
        }
    }

    export class Sequence<E, T> extends Task<E, Array<T>> {
        constructor(protected readonly tasks: Array<Task<E, T>>) {
            super();
        }

        protected execute(): Promise<Array<T>> {
            const result: Array<Promise<T>> = [];

            for (const task of this.tasks) {
                result.push(Task.execute(task));
            }

            return Promise.all(result);
        }
    }

    export class Map<E, T, R> extends Task<E, R> {
        constructor(
            protected readonly fn: (value: T) => R,
            protected readonly task: Task<E, T>
        ) {
            super();
        }

        protected execute(): Promise<R> {
            return Task.execute(this.task).then(this.fn);
        }
    }

    export class Chain<E, T, R> extends Task<E, R> {
        constructor(
            protected readonly fn: (value: T) => Task<E, R>,
            protected readonly task: Task<E, T>
        ) {
            super();
        }

        protected execute(): Promise<R> {
            return Task.execute(this.task).then((value: T) => Task.execute(this.fn(value)));
        }
    }

    export class OnError<E, T, S> extends Task<S, T> {
        constructor(
            protected readonly fn: (error: E) => Task<S, T>,
            protected readonly task: Task<E, T>
        ) {
            super();
        }

        protected execute(): Promise<T> {
            return Task.execute(this.task).catch((error: E): Promise<T> => Task.execute(this.fn(error)));
        }
    }

    export class MapError<E, T, S> extends Task<S, T> {
        constructor(
            protected readonly fn: (error: E) => S,
            protected readonly task: Task<E, T>
        ) {
            super();
        }

        protected execute(): Promise<T> {
            return Task.execute(this.task).catch((error: E): Promise<T> => Promise.reject(this.fn(error)));
        }
    }
}
