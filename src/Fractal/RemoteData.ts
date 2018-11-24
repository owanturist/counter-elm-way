import {
    Cata
} from './Basics';
import {
    Maybe,
    Nothing,
    Just
} from './Maybe';
import {
    Either
} from './Either';

export type Pattern<E, T, R> = Cata<{
    NotAsked(): R;
    Loading(): R;
    Failure(error: E): R;
    Succeed(value: T): R;
}>;

export abstract class RemoteData<E, T> {
    public static fromMaybe<E, T>(error: E, maybe: Maybe<T>): RemoteData<E, T> {
        return maybe.fold((): RemoteData<E, T> => Failure(error), Succeed);
    }

    public static fromEither<E, T>(either: Either<E, T>): RemoteData<E, T> {
        return either.fold(Failure as ((error: E) => RemoteData<E, T>), Succeed);
    }

    public static props<E, T extends object>(config: {[ K in keyof T ]: RemoteData<E, T[ K ]>}): RemoteData<E, T> {
        let acc: RemoteData<E, T> = Succeed({} as T);

        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                acc = acc.chain(
                    (obj: T): RemoteData<E, T> => config[ key ].map(
                        (value: T[Extract<keyof T, string>]): T => {
                            obj[ key ] = value;

                            return obj;
                        }
                    )
                );
            }
        }

        return acc;
    }

    public static sequence<E, T>(array: Array<RemoteData<E, T>>): RemoteData<E, Array<T>> {
        let acc: RemoteData<E, Array<T>> = Succeed([]);

        for (const item of array) {
            acc = acc.chain(
                (arr: Array<T>): RemoteData<E, Array<T>> => item.map(
                    (value: T): Array<T> => {
                        arr.push(value);

                        return arr;
                    }
                )
            );
        }

        return acc;
    }

    public abstract isNotAsked(): boolean;
    public abstract isLoading(): boolean;
    public abstract isFailure(): boolean;
    public abstract isSucceed(): boolean;
    public abstract isEqual(another: RemoteData<E, T>): boolean;

    public abstract getOrElse(defaults: T): T;

    public abstract ap<R>(remoteDataFn: RemoteData<E, (value: T) => R>): RemoteData<E, R>;
    public abstract map<R>(fn: (value: T) => R): RemoteData<E, R>;
    public abstract chain<R>(fn: (value: T) => RemoteData<E, R>): RemoteData<E, R>;
    public abstract bimap<S, R>(failureFn: (error: E) => S, succeedFn: (value: T) => R): RemoteData<S, R>;
    public abstract swap(): RemoteData<T, E>;
    public abstract failureMap<S>(fn: (error: E) => S): RemoteData<S, T>;
    public abstract pipe<S>(
        either: T extends (value: infer A) => unknown
            ? RemoteData<[ E ] extends [ never ] ? S : E, A>
            : never
    ): RemoteData<[ E ] extends [ never ] ? S : E, T extends (value: unknown) => infer U ? U : T>;

    public abstract cata<R>(pattern: Pattern<E, T, R>): R;

    public abstract toMaybe(): Maybe<T>;
}

namespace Internal {
    export class NotAsked<E, T> extends RemoteData<E, T> {
        public isNotAsked(): boolean {
            return true;
        }

        public isLoading(): boolean {
            return false;
        }

        public isFailure(): boolean {
            return false;
        }

        public isSucceed(): boolean {
            return false;
        }

        public isEqual(another: RemoteData<E, T>): boolean {
            return another.cata({
                NotAsked: (): boolean  => true,
                _: (): boolean => false
            });
        }

        public getOrElse(defaults: T): T {
            return defaults;
        }

        public ap<R>(): RemoteData<E, R> {
            return this as unknown as RemoteData<E, R>;
        }

        public map<R>(): RemoteData<E, R> {
            return this as unknown as RemoteData<E, R>;
        }

        public chain<R>(): RemoteData<E, R> {
            return this as unknown as RemoteData<E, R>;
        }

        public bimap<S, R>(): RemoteData<S, R> {
            return this as unknown as RemoteData<S, R>;
        }

        public swap(): RemoteData<T, E> {
            return this as unknown as RemoteData<T, E>;
        }

        public failureMap<S>(): RemoteData<S, T> {
            return this as unknown as RemoteData<S, T>;
        }

        public pipe<S, U>(): RemoteData<[ E ] extends [ never ] ? S : E, T extends (value: unknown) => U ? U : T> {
            return this as unknown as RemoteData<
                [ E ] extends [ never ] ? S : E,
                T extends (value: unknown) => U ? U : T
            >;
        }

        public cata<R>(pattern: Pattern<E, T, R>): R {
            if (typeof pattern.NotAsked === 'function') {
                return pattern.NotAsked();
            }

            return (pattern._ as () => R)();
        }

        public toMaybe(): Maybe<T> {
            return Nothing;
        }
    }

    export class Loading<E, T> extends RemoteData<E, T> {
        public isNotAsked(): boolean {
            return false;
        }

        public isLoading(): boolean {
            return true;
        }

        public isFailure(): boolean {
            return false;
        }

        public isSucceed(): boolean {
            return false;
        }

        public isEqual(another: RemoteData<E, T>): boolean {
            return another.cata({
                Loading: (): boolean  => true,
                _: (): boolean => false
            });
        }

        public getOrElse(defaults: T): T {
            return defaults;
        }

        public ap<R>(): RemoteData<E, R> {
            return this as unknown as RemoteData<E, R>;
        }

        public map<R>(): RemoteData<E, R> {
            return this as unknown as RemoteData<E, R>;
        }

        public chain<R>(): RemoteData<E, R> {
            return this as unknown as RemoteData<E, R>;
        }

        public bimap<S, R>(): RemoteData<S, R> {
            return this as unknown as RemoteData<S, R>;
        }

        public swap(): RemoteData<T, E> {
            return this as unknown as RemoteData<T, E>;
        }

        public failureMap<S>(): RemoteData<S, T> {
            return this as unknown as RemoteData<S, T>;
        }

        public pipe<S, U>(): RemoteData<[ E ] extends [ never ] ? S : E, T extends (value: unknown) => U ? U : T> {
            return this as unknown as RemoteData<
                [ E ] extends [ never ] ? S : E,
                T extends (value: unknown) => U ? U : T
            >;
        }

        public cata<R>(pattern: Pattern<E, T, R>): R {
            if (typeof pattern.Loading === 'function') {
                return pattern.Loading();
            }

            return (pattern._ as () => R)();
        }

        public toMaybe(): Maybe<T> {
            return Nothing;
        }
    }

    export class Failure<E, T> extends RemoteData<E, T> {
        constructor(private readonly error: E) {
            super();
        }

        public isNotAsked(): boolean {
            return false;
        }

        public isLoading(): boolean {
            return false;
        }

        public isFailure(): boolean {
            return true;
        }

        public isSucceed(): boolean {
            return false;
        }

        public isEqual(another: RemoteData<E, T>): boolean {
            return another.cata({
                Failure: (error: E): boolean  => error === this.error,
                _: (): boolean => false
            });
        }

        public getOrElse(defaults: T): T {
            return defaults;
        }

        public ap<R>(): RemoteData<E, R> {
            return this as unknown as RemoteData<E, R>;
        }

        public map<R>(): RemoteData<E, R> {
            return this as unknown as RemoteData<E, R>;
        }

        public chain<R>(): RemoteData<E, R> {
            return this as unknown as RemoteData<E, R>;
        }

        public bimap<S, R>(failureFn: (error: E) => S): Failure<S, R> {
            return new Failure(
                failureFn(this.error)
            );
        }

        public swap(): RemoteData<T, E> {
            return new Succeed(this.error);
        }

        public failureMap<S>(fn: (error: E) => S): Failure<S, T> {
            return new Failure(
                fn(this.error)
            );
        }

        public pipe<S, U>(): RemoteData<[ E ] extends [ never ] ? S : E, T extends (value: unknown) => U ? U : T> {
            return this as unknown as RemoteData<
                [ E ] extends [ never ] ? S : E,
                T extends (value: unknown) => U ? U : T
            >;
        }

        public cata<R>(pattern: Pattern<E, T, R>): R {
            if (typeof pattern.Failure === 'function') {
                return pattern.Failure(this.error);
            }

            return (pattern._ as () => R)();
        }

        public toMaybe(): Maybe<T> {
            return Nothing;
        }
    }

    export class Succeed<E, T> extends RemoteData<E, T> {
        constructor(private readonly value: T) {
            super();
        }

        public isNotAsked(): boolean {
            return false;
        }

        public isLoading(): boolean {
            return false;
        }

        public isFailure(): boolean {
            return false;
        }

        public isSucceed(): boolean {
            return true;
        }

        public isEqual(another: RemoteData<E, T>): boolean {
            return another.cata({
                Succeed: (value: T): boolean  => value === this.value,
                _: (): boolean => false
            });
        }

        public getOrElse(): T {
            return this.value;
        }

        public ap<R>(remoteDataFn: RemoteData<E, (value: T) => R>): RemoteData<E, R> {
            return remoteDataFn.map(
                (fn: (value: T) => R): R => fn(this.value)
            );
        }

        public map<R>(fn: (value: T) => R): RemoteData<E, R> {
            return new Succeed(
                fn(this.value)
            );
        }

        public chain<R>(fn: (value: T) => RemoteData<E, R>): RemoteData<E, R> {
            return fn(this.value);
        }

        public bimap<S, R>(_failureFn: (error: E) => S, succeedFn: (value: T) => R): RemoteData<S, R> {
            return new Succeed(
                succeedFn(this.value)
            );
        }

        public swap(): RemoteData<T, E> {
            return new Failure(this.value);
        }

        public failureMap<S>(): RemoteData<S, T> {
            return this as unknown as RemoteData<S, T>;
        }

        public pipe<S, A, U>(
            either: T extends (value: A) => unknown
                ? RemoteData<[ E ] extends [ never ] ? S : E, A>
                : never
        ): RemoteData<[ E ] extends [ never ] ? S : E, T extends (value: unknown) => U ? U : T> {
            return either.map(
                this.value as unknown as (value: A) => U
            ) as unknown as RemoteData<[ E ] extends [ never ] ? S : E, T extends (value: unknown) => U ? U : T>;
        }

        public cata<R>(pattern: Pattern<E, T, R>): R {
            if (typeof pattern.Succeed === 'function') {
                return pattern.Succeed(this.value);
            }

            return (pattern._ as () => R)();
        }

        public toMaybe(): Maybe<T> {
            return Just(this.value);
        }
    }
}

export const NotAsked: RemoteData<never, never> = new Internal.NotAsked();

export const Loading: RemoteData<never, never> = new Internal.Loading();

export const Failure = <E>(error: E): RemoteData<E, never> => new Internal.Failure(error);

export const Succeed = <T>(value: T): RemoteData<never, T> => new Internal.Succeed(value);
