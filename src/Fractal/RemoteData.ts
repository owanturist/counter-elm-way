import {
    DefaultCase,
    WithDefaultCase
} from './Basics';
import {
    Maybe,
    Nothing,
    Just
} from './Maybe';
import {
    Either
} from './Either';

export type Pattern<E, T, R> = WithDefaultCase<{
    NotAsked(): R;
    Loading(): R;
    Failure(error: E): R;
    Succeed(value: T): R;
}, R>;

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

    public abstract cata<R>(pattern: Pattern<E, T, R>): R;

    public abstract toMaybe(): Maybe<T>;
}

namespace Internal {
    export class NotAsked extends RemoteData<never, never> {
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

        public isEqual<E, T>(another: RemoteData<E, T>): boolean {
            return another.cata({
                NotAsked: (): boolean  => true,
                _: (): boolean => false
            });
        }

        public getOrElse<T>(defaults: T): T {
            return defaults;
        }

        public ap(): NotAsked {
            return this;
        }

        public map(): NotAsked {
            return this;
        }

        public chain(): NotAsked {
            return this;
        }

        public bimap(): NotAsked {
            return this;
        }

        public swap(): NotAsked {
            return this;
        }

        public failureMap(): NotAsked {
            return this;
        }

        public cata<E, T, R>(pattern: Pattern<E, T, R>): R {
            if (typeof pattern.NotAsked === 'function') {
                return pattern.NotAsked();
            }

            return (pattern as DefaultCase<R>)._();
        }

        public toMaybe(): Maybe<never> {
            return Nothing;
        }
    }

    export class Loading extends RemoteData<never, never> {
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

        public isEqual<E, T>(another: RemoteData<E, T>): boolean {
            return another.cata({
                Loading: (): boolean  => true,
                _: (): boolean => false
            });
        }

        public getOrElse<T>(defaults: T): T {
            return defaults;
        }

        public ap(): Loading {
            return this;
        }

        public map(): Loading {
            return this;
        }

        public chain(): Loading {
            return this;
        }

        public bimap(): Loading {
            return this;
        }

        public swap(): Loading {
            return this;
        }

        public failureMap(): Loading {
            return this;
        }

        public cata<E, T, R>(pattern: Pattern<E, T, R>): R {
            if (typeof pattern.Loading === 'function') {
                return pattern.Loading();
            }

            return (pattern as DefaultCase<R>)._();
        }

        public toMaybe(): Maybe<never> {
            return Nothing;
        }
    }

    export class Failure<E> extends RemoteData<E, never> {
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

        public isEqual<T>(another: RemoteData<E, T>): boolean {
            return another.cata({
                Failure: (error: E): boolean  => error === this.error,
                _: (): boolean => false
            });
        }

        public getOrElse<T>(defaults: T): T {
            return defaults;
        }

        public ap(): Failure<E> {
            return this;
        }

        public map(): Failure<E> {
            return this;
        }

        public chain(): Failure<E> {
            return this;
        }

        public bimap<R>(failureFn: (error: E) => R): Failure<R> {
            return new Failure(
                failureFn(this.error)
            );
        }

        public swap(): Succeed<E> {
            return new Succeed(this.error);
        }

        public failureMap<R>(fn: (error: E) => R): Failure<R> {
            return new Failure(
                fn(this.error)
            );
        }

        public cata<T, R>(pattern: Pattern<E, T, R>): R {
            if (typeof pattern.Failure === 'function') {
                return pattern.Failure(this.error);
            }

            return (pattern as DefaultCase<R>)._();
        }

        public toMaybe(): Maybe<never> {
            return Nothing;
        }
    }

    export class Succeed<T> extends RemoteData<never, T> {
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

        public isEqual<E>(another: RemoteData<E, T>): boolean {
            return another.cata({
                Succeed: (value: T): boolean  => value === this.value,
                _: (): boolean => false
            });
        }

        public getOrElse(): T {
            return this.value;
        }

        public ap<E, R>(remoteDataFn: RemoteData<E, (value: T) => R>): RemoteData<E, R> {
            return remoteDataFn.map(
                (fn: (value: T) => R): R => fn(this.value)
            );
        }

        public map<E, R>(fn: (value: T) => R): RemoteData<E, R> {
            return new Succeed(
                fn(this.value)
            );
        }

        public chain<E, R>(fn: (value: T) => RemoteData<E, R>): RemoteData<E, R> {
            return fn(this.value);
        }

        public bimap<E, S, R>(_failureFn: (error: E) => S, succeedFn: (value: T) => R): RemoteData<S, R> {
            return new Succeed(
                succeedFn(this.value)
            );
        }

        public swap(): Failure<T> {
            return new Failure(this.value);
        }

        public failureMap(): Succeed<T> {
            return this;
        }

        public cata<E, R>(pattern: Pattern<E, T, R>): R {
            if (typeof pattern.Succeed === 'function') {
                return pattern.Succeed(this.value);
            }

            return (pattern as DefaultCase<R>)._();
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
