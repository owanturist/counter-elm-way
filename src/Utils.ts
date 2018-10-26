import {
    Maybe,
    Nothing,
    Just
} from 'Fractal/Maybe';

export const find = <T>(predicate: (value: T) => boolean, arr: Array<T>): Maybe<T> => {
    for (const item of arr) {
        if (predicate(item)) {
            return Just(item);
        }
    }

    return Nothing;
};

export const round = (fractionDigits: number, num: number): number => Number(num.toFixed(fractionDigits));
