export type IsNever<A, T, F> = [ A ] extends [ never ] ? T : F;

export type WhenNever<A, T> = [ A, T ] extends [ T, A ] ? A : IsNever<A, T, A>;

type Combinations<T> =  {
    [ K in keyof T ]: {
        [ N in keyof T ]?: N extends K ? never : T[ N ];
    };
}[ keyof T ];

export type Cata<T>
    = T extends {[ K in keyof T ]: (...args: Array<unknown>) => infer R }
    ? T & { _?: never } | Combinations<T> & { _(): R }
    : T
    ;
