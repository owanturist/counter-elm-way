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
        return maybe.cata({
            Nothing: (): RemoteData<E, T> => Failure(error),
            Just: Succeed
        }) as RemoteData<E, T>;
    }

    public static fromEither<E, T>(either: Either<E, T>): RemoteData<E, T> {
        return either.fold(Failure, Succeed) as RemoteData<E, T>;
    }

    public static props<E, T extends object>(config: {[ K in keyof T ]: RemoteData<E, T[ K ]>}): RemoteData<E, T> {
        let acc = Succeed<E, T>({} as T);

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

namespace Variations {
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
            return this as any as RemoteData<E, R>;
        }

        public map<R>(): RemoteData<E, R> {
            return this as any as RemoteData<E, R>;
        }

        public chain<R>(): RemoteData<E, R> {
            return this as any as RemoteData<E, R>;
        }

        public bimap<S, R>(): RemoteData<S, R> {
            return this as any as RemoteData<S, R>;
        }

        public swap(): RemoteData<T, E> {
            return this as any as RemoteData<T, E>;
        }

        public failureMap<S>(): RemoteData<S, T> {
            return this as any as RemoteData<S, T>;
        }

        public cata<R>(pattern: Pattern<E, T, R>): R {
            if (typeof pattern.NotAsked === 'function') {
                return pattern.NotAsked();
            }

            return (pattern as DefaultCase<R>)._();
        }

        public toMaybe(): Maybe<T> {
            return Nothing();
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
            return this as any as RemoteData<E, R>;
        }

        public map<R>(): RemoteData<E, R> {
            return this as any as RemoteData<E, R>;
        }

        public chain<R>(): RemoteData<E, R> {
            return this as any as RemoteData<E, R>;
        }

        public bimap<S, R>(): RemoteData<S, R> {
            return this as any as RemoteData<S, R>;
        }

        public swap(): RemoteData<T, E> {
            return this as any as RemoteData<T, E>;
        }

        public failureMap<S>(): RemoteData<S, T> {
            return this as any as RemoteData<S, T>;
        }

        public cata<R>(pattern: Pattern<E, T, R>): R {
            if (typeof pattern.Loading === 'function') {
                return pattern.Loading();
            }

            return (pattern as DefaultCase<R>)._();
        }

        public toMaybe(): Maybe<T> {
            return Nothing();
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
            return this as any as RemoteData<E, R>;
        }

        public map<R>(): RemoteData<E, R> {
            return this as any as RemoteData<E, R>;
        }

        public chain<R>(): RemoteData<E, R> {
            return this as any as RemoteData<E, R>;
        }

        public bimap<S, R>(failureFn: (error: E) => S): RemoteData<S, R> {
            return new Failure(
                failureFn(this.error)
            );
        }

        public swap(): RemoteData<T, E> {
            return new Succeed(this.error);
        }

        public failureMap<S>(fn: (error: E) => S): RemoteData<S, T> {
            return new Failure(
                fn(this.error)
            );
        }

        public cata<R>(pattern: Pattern<E, T, R>): R {
            if (typeof pattern.Failure === 'function') {
                return pattern.Failure(this.error);
            }

            return (pattern as DefaultCase<R>)._();
        }

        public toMaybe(): Maybe<T> {
            return Nothing();
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
            return this as any as RemoteData<S, T>;
        }

        public cata<R>(pattern: Pattern<E, T, R>): R {
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

export const NotAsked = <E, T>(): RemoteData<E, T> => new Variations.NotAsked();

export const Loading = <E, T>(): RemoteData<E, T> => new Variations.Loading();

export const Failure = <E, T>(error: E): RemoteData<E, T> => new Variations.Failure(error);

export const Succeed = <E, T>(value: T): RemoteData<E, T> => new Variations.Succeed(value);
