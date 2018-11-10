import {
    DefaultCase,
    WithDefaultCase
} from './Basics';
import {
    Maybe,
    Nothing,
    Just
} from './Maybe';

export type Pattern<E, T, R> = WithDefaultCase<{
    Left(error: E): R;
    Right(value: T): R;
}, R>;

export abstract class Either<E, T> {
    public static fromNullable<E, T>(error: E, value: T | null | undefined): Either<E, T> {
        return value == null ? Left(error) : Right(value);
    }

    public static fromMaybe<E, T>(error: E, maybe: Maybe<T>): Either<E, T> {
        return maybe.fold((): Either<E, T> => Left(error), Right);
    }

    public static props<E, T extends object>(config: {[ K in keyof T ]: Either<E, T[ K ]>}): Either<E, T> {
        let acc: Either<E, T> = Right({} as T);

        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                acc = acc.chain(
                    (obj: T): Either<E, T> => config[ key ].map(
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

    public static sequence<E, T>(array: Array<Either<E, T>>): Either<E, Array<T>> {
        let acc: Either<E, Array<T>> = Right([]);

        for (const item of array) {
            acc = acc.chain(
                (arr: Array<T>): Either<E, Array<T>> => item.map(
                    (value: T): Array<T> => {
                        arr.push(value);

                        return arr;
                    }
                )
            );
        }

        return acc;
    }

    public abstract isLeft(): boolean;
    public abstract isRight(): boolean;
    public abstract isEqual(another: Either<E, T>): boolean;

    public abstract getOrElse(defaults: T): T;

    public abstract ap<R>(eitherFn: Either<E, (value: T) => R>): Either<E, R>;
    public abstract map<R>(fn: (value: T) => R): Either<E, R>;
    public abstract chain<R>(fn: (value: T) => Either<E, R>): Either<E, R>;
    public abstract bimap<S, R>(leftFn: (error: E) => S, rightFn: (value: T) => R): Either<S, R>;
    public abstract swap(): Either<T, E>;
    public abstract leftMap<S>(fn: (error: E) => S): Either<S, T>;
    public abstract orElse(fn: (error: E) => Either<E, T>): Either<E, T>;
    public abstract pipe(
        either: T extends (value: infer A) => unknown ? Either<E, A> : never
    ): Either<E, T extends (value: unknown) => infer U ? U : T>;

    public abstract fold<R>(leftFn: (error: E) => R, rightFn: (value: T) => R): R;
    public abstract cata<R>(pattern: Pattern<E, T, R>): R;

    public abstract toMaybe(): Maybe<T>;
}

namespace Internal {
    export class Left<E> extends Either<E, never> {
        constructor(private readonly error: E) {
            super();
        }

        public isLeft(): boolean {
            return true;
        }

        public isRight(): boolean {
            return false;
        }

        public isEqual<T>(another: Either<E, T>): boolean {
            return another.fold(
                (error: E): boolean => error === this.error,
                (): boolean => false
            );
        }

        public getOrElse<T>(defaults: T): T {
            return defaults;
        }

        public ap(): Left<E> {
            return this;
        }

        public map(): Left<E> {
            return this;
        }

        public chain(): Left<E> {
            return this;
        }

        public bimap<R>(leftFn: (error: E) => R): Left<R> {
            return new Left(
                leftFn(this.error)
            );
        }

        public swap(): Right<E> {
            return new Right(this.error);
        }

        public leftMap<R>(fn: (error: E) => R): Left<R> {
            return new Left(
                fn(this.error)
            );
        }

        public orElse<T>(fn: (error: E) => Either<E, T>): Either<E, T> {
            return fn(this.error);
        }

        public pipe(): Left<E> {
            return this;
        }

        public fold<R>(leftFn: (error: E) => R): R {
            return leftFn(this.error);
        }

        public cata<T, R>(pattern: Pattern<E, T, R>): R {
            if (typeof pattern.Left === 'function') {
                return pattern.Left(this.error);
            }

            return (pattern as DefaultCase<R>)._();
        }

        public toMaybe(): Maybe<never> {
            return Nothing;
        }
    }

    export class Right<T> extends Either<never, T> {
        constructor(private readonly value: T) {
            super();
        }

        public isLeft(): boolean {
            return false;
        }

        public isRight(): boolean {
            return true;
        }

        public isEqual<E>(another: Either<E, T>): boolean {
            return another.fold(
                (): boolean => false,
                (value: T): boolean => value === this.value
            );
        }

        public getOrElse(): T {
            return this.value;
        }

        public ap<E, R>(eitherFn: Either<E, (value: T) => R>): Either<E, R> {
            return eitherFn.map(
                (fn: (value: T) => R): R => fn(this.value)
            );
        }

        public map<E, R>(fn: (value: T) => R): Either<E, R> {
            return new Right(
                fn(this.value)
            );
        }

        public chain<E, R>(fn: (value: T) => Either<E, R>): Either<E, R> {
            return fn(this.value);
        }

        public bimap<E, S, R>(_leftFn: (error: E) => S, rightFn: (value: T) => R): Right<R> {
            return new Right(
                rightFn(this.value)
            );
        }

        public swap(): Left<T> {
            return new Left(this.value);
        }

        public leftMap(): Right<T> {
            return this;
        }

        public orElse(): Right<T> {
            return this;
        }

        public pipe<E, A, U>(either: T extends (value: A) => unknown ? Either<E, A> : never): Either<E, U> {
            return either.map(this.value as unknown as (value: A) => U);
        }

        public fold<E, R>(_leftFn: (error: E) => R, rightFn: (value: T) => R): R {
            return rightFn(this.value);
        }

        public cata<E, R>(pattern: Pattern<E, T, R>): R {
            if (typeof pattern.Right === 'function') {
                return pattern.Right(this.value);
            }

            return (pattern as DefaultCase<R>)._();
        }

        public toMaybe(): Maybe<T> {
            return Just(this.value);
        }
    }
}

export const Left = <E>(error: E): Either<E, never> => new Internal.Left(error);

export const Right = <T>(value: T): Either<never, T> => new Internal.Right(value);