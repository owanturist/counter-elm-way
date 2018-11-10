import {
    DefaultCase,
    WithDefaultCase
} from './Basics';
import {
    Either,
    Left,
    Right
} from './Either';

export type Pattern<T, R> = WithDefaultCase<{
    Nothing(): R;
    Just(value: T): R;
}, R>;

export abstract class Maybe<T> {
    public static fromNullable<T>(value: T | null | undefined): Maybe<T> {
        return value == null ? Nothing : Just(value);
    }

    public static fromEither<E, T>(either: Either<E, T>): Maybe<T> {
        return either.fold(() => Nothing, Just);
    }

    public static props<T extends object>(config: {[ K in keyof T ]: Maybe<T[ K ]>}): Maybe<T> {
        let acc: Maybe<T> = Just({} as T);

        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                acc = acc.chain(
                    (obj: T): Maybe<T> => config[ key ].map(
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

    public static sequence<T>(array: Array<Maybe<T>>): Maybe<Array<T>> {
        let acc: Maybe<Array<T>> = Just([]);

        for (const item of array) {
            acc = acc.chain(
                (arr: Array<T>): Maybe<Array<T>> => item.map(
                    (value: T): Array<T> => {
                        arr.push(value);

                        return arr;
                    }
                )
            );
        }

        return acc;
    }

    public abstract isNothing(): boolean;
    public abstract isJust(): boolean;
    public abstract isEqual(another: Maybe<T>): boolean;

    public abstract getOrElse(defaults: T): T;

    public abstract ap<R>(maybeFn: Maybe<(value: T) => R>): Maybe<R>;
    public abstract map<R>(fn: (value: T) => R): Maybe<R>;
    public abstract chain<R>(fn: (value: T) => Maybe<R>): Maybe<R>;
    public abstract orElse(fn: () => Maybe<T>): Maybe<T>;
    public abstract pipe(
        maybe: T extends (value: infer A) => unknown ? Maybe<A> : never
    ): Maybe<T extends (value: unknown) => infer U ? U : T>;

    public abstract fold<R>(nothingFn: () => R, justFn: (value: T) => R): R;
    public abstract cata<R>(pattern: Pattern<T, R>): R;

    public abstract toEither<E>(error: E): Either<E, T>;
}

namespace Internal {
    export class Nothing extends Maybe<never> {
        public isNothing(): boolean {
            return true;
        }

        public isJust(): boolean {
            return false;
        }

        public isEqual<T>(another: Maybe<T>): boolean {
            return another.isNothing();
        }

        public getOrElse<T>(defaults: T): T {
            return defaults;
        }

        public ap(): Nothing {
            return this;
        }

        public map(): Nothing {
            return this;
        }

        public chain(): Nothing {
            return this;
        }

        public orElse<T>(fn: () => Maybe<T>): Maybe<T> {
            return fn();
        }

        public pipe(): Nothing {
            return this;
        }

        public fold<R>(nothingFn: () => R): R {
            return nothingFn();
        }

        public cata<T, R>(pattern: Pattern<T, R>): R {
            if (typeof pattern.Nothing === 'function') {
                return pattern.Nothing();
            }

            return (pattern as DefaultCase<R>)._();
        }

        public toEither<E, T>(error: E): Either<E, T> {
            return Left(error);
        }
    }

    export class Just<T> extends Maybe<T> {
        constructor(private readonly value: T) {
            super();
        }

        public isNothing(): boolean {
            return false;
        }

        public isJust(): boolean {
            return true;
        }

        public isEqual(another: Maybe<T>): boolean {
            return another.fold(
                (): boolean => false,
                (value: T): boolean => value === this.value
            );
        }

        public getOrElse(): T {
            return this.value;
        }

        public ap<R>(maybeFn: Maybe<(value: T) => R>): Maybe<R> {
            return maybeFn.map(
                (fn: (value: T) => R): R => fn(this.value)
            );
        }

        public map<R>(fn: (value: T) => R): Just<R> {
            return new Just(
                fn(this.value)
            );
        }

        public chain<R>(fn: (value: T) => Maybe<R>): Maybe<R> {
            return fn(this.value);
        }

        public orElse(): Just<T> {
            return this;
        }

        public pipe<A, U>(maybe: T extends (value: A) => unknown ? Maybe<A> : never): Maybe<U> {
            return maybe.map(this.value as unknown as (value: A) => U);
        }

        public fold<R>(_nothingFn: () => R, justFn: (value: T) => R): R {
            return justFn(this.value);
        }

        public cata<R>(pattern: Pattern<T, R>): R {
            if (typeof pattern.Just === 'function') {
                return pattern.Just(this.value);
            }

            return (pattern as DefaultCase<R>)._();
        }

        public toEither<E>(): Either<E, T> {
            return Right(this.value);
        }
    }
}

export const Nothing: Maybe<never> = new Internal.Nothing();

export const Just = <T>(value: T): Maybe<T> => new Internal.Just(value);
