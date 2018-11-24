import {
    WhenNever,
    Cata
} from './Basics';
import {
    Maybe,
    Nothing,
    Just
} from './Maybe';

export type Pattern<E, T, R> = Cata<{
    Left(error: E): R;
    Right(value: T): R;
}>;

export abstract class Either<E, T> {
    public static fromNullable<E, T>(
        error: E, value: T | null | undefined
    ): Either<E, T extends null | undefined ? never : T> {
        return value == null
            ? Left(error)
            : Right(value as T extends null | undefined ? never : T);
    }

    public static fromMaybe<E, T>(error: E, maybe: Maybe<T>): Either<E, T> {
        return maybe.fold((): Either<E, T> => Left(error), Right);
    }

    public static props<E, T>(config: {[ K in keyof T ]: Either<E, T[ K ]>}): Either<E, T> {
        let acc: Either<E, T> = Right({} as T);

        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                acc = acc.chain(
                    (obj: T): Either<E, T> => config[ key ].map(
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
    public abstract isEqual<G, D>(another: Either<WhenNever<E, G>, WhenNever<T, D>>): boolean;

    public abstract map<R>(fn: (value: T) => R): Either<E, R>;
    public abstract chain<G, R>(fn: (value: T) => Either<WhenNever<E, G>, R>): Either<WhenNever<E, G>, R>;
    public abstract ap<G, R>(eitherFn: Either<WhenNever<E, G>, (value: T) => R>): Either<WhenNever<E, G>, R>;
    public abstract pipe<G>(
        either: T extends (value: infer A) => unknown
            ? Either<WhenNever<E, G>, A>
            : never
    ): Either<WhenNever<E, G>, T extends (value: unknown) => infer U ? U : T>;

    public abstract bimap<S, R>(leftFn: (error: E) => S, rightFn: (value: T) => R): Either<S, R>;
    public abstract swap(): Either<T, E>;
    public abstract mapLeft<S>(fn: (error: E) => S): Either<S, T>;

    public abstract orElse<G, D>(
        fn: (error: WhenNever<E, G>) => Either<WhenNever<E, G>, WhenNever<T, D>>
    ): Either<WhenNever<E, G>, WhenNever<T, D>>;
    public abstract getOrElse<D>(defaults: WhenNever<T, D>): WhenNever<T, D>;

    public abstract fold<R>(leftFn: (error: E) => R, rightFn: (value: T) => R): R;
    public abstract cata<R>(pattern: Pattern<E, T, R>): R;

    public abstract toMaybe(): Maybe<T>;
}

namespace Internal {
    export class Left<E, T> extends Either<E, T> {
        constructor(private readonly error: E) {
            super();
        }

        public isLeft(): boolean {
            return true;
        }

        public isRight(): boolean {
            return false;
        }

        public isEqual<G, D>(another: Either<WhenNever<E, G>, WhenNever<T, D>>): boolean {
            return another.fold(
                (error: WhenNever<E, G>): boolean => error === this.error,
                (): boolean => false
            );
        }

        public map<R>(): Either<E, R> {
            return this as any as Either<E, R>;
        }

        public chain<G, R>(): Either<WhenNever<E, G>, R> {
            return this as any as Either<WhenNever<E, G>, R>;
        }

        public ap<G, R>(): Either<WhenNever<E, G>, R> {
            return this as any as Either<WhenNever<E, G>, R>;
        }

        public pipe<G, U>(): Either<WhenNever<E, G>, T extends (value: unknown) => U ? U : T> {
            return this as unknown as Either<WhenNever<E, G>, T extends (value: unknown) => U ? U : T>;
        }

        public bimap<S, R>(leftFn: (error: E) => S): Either<S, R> {
            return new Left(
                leftFn(this.error)
            );
        }

        public swap(): Either<T, E> {
            return new Right(this.error);
        }

        public mapLeft<S>(fn: (error: E) => S): Either<S, T> {
            return new Left(
                fn(this.error)
            );
        }

        public orElse<G, D>(
            fn: (error: WhenNever<E, G>) => Either<WhenNever<E, G>, WhenNever<T, D>>
        ): Either<WhenNever<E, G>, WhenNever<T, D>> {
            return fn(this.error as WhenNever<E, G>);
        }

        public getOrElse<D>(defaults: WhenNever<T, D>): WhenNever<T, D> {
            return defaults;
        }

        public fold<R>(leftFn: (error: E) => R): R {
            return leftFn(this.error);
        }

        public cata<R>(pattern: Pattern<E, T, R>): R {
            if (typeof pattern.Left === 'function') {
                return pattern.Left(this.error);
            }

            return (pattern._ as () => R)();
        }

        public toMaybe(): Maybe<T> {
            return Nothing;
        }
    }

    export class Right<E, T> extends Either<E, T> {
        constructor(private readonly value: T) {
            super();
        }

        public isLeft(): boolean {
            return false;
        }

        public isRight(): boolean {
            return true;
        }

        public isEqual<G, D>(another: Either<WhenNever<E, G>, WhenNever<T, D>>): boolean {
            return another.fold(
                (): boolean => false,
                (value: WhenNever<T, D>): boolean => value === this.value
            );
        }

        public map<R>(fn: (value: T) => R): Either<E, R> {
            return new Right(
                fn(this.value)
            );
        }

        public chain<G, R>(fn: (value: T) => Either<WhenNever<E, G>, R>): Either<WhenNever<E, G>, R> {
            return fn(this.value);
        }

        public ap<G, R>(eitherFn: Either<WhenNever<E, G>, (value: T) => R>): Either<WhenNever<E, G>, R> {
            return eitherFn.pipe<WhenNever<E, G>>(this as unknown as Either<WhenNever<E, G>, T>);
        }

        public pipe<G, A, U>(
            either: T extends (value: A) => unknown
                ? Either<WhenNever<E, G>, A>
                : never
        ): Either<WhenNever<E, G>, T extends (value: unknown) => U ? U : T> {
            return either.map(
                this.value as unknown as (value: A) => U
            ) as unknown as Either<WhenNever<E, G>, T extends (value: unknown) => U ? U : T>;
        }

        public bimap<S, R>(_leftFn: (error: E) => S, rightFn: (value: T) => R): Either<S, R> {
            return new Right(
                rightFn(this.value)
            );
        }

        public swap(): Either<T, E> {
            return new Left(this.value);
        }

        public mapLeft<S>(): Either<S, T> {
            return this as any as Either<S, T>;
        }

        public orElse<G, D>(): Either<WhenNever<E, G>, WhenNever<T, D>> {
            return this as unknown as Either<WhenNever<E, G>, WhenNever<T, D>>;
        }

        public getOrElse<D>(): WhenNever<T, D> {
            return this.value as WhenNever<T, D>;
        }

        public fold<R>(_leftFn: (error: E) => R, rightFn: (value: T) => R): R {
            return rightFn(this.value);
        }

        public cata<R>(pattern: Pattern<E, T, R>): R {
            if (typeof pattern.Right === 'function') {
                return pattern.Right(this.value);
            }

            return (pattern._ as () => R)();
        }

        public toMaybe(): Maybe<T> {
            return Just(this.value);
        }
    }
}

export const Left = <E>(error: E): Either<E, never> => new Internal.Left(error);

export const Right = <T>(value: T): Either<never, T> => new Internal.Right(value);
