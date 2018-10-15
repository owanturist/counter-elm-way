export interface DefaultCase<R> {
    _(): R;
}

export type WithDefaultCase<T, R> = T | Partial<T> & DefaultCase<R>;
