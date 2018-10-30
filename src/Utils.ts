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

export const stringToNumber = (str: string): Maybe<number> => {
    const result = Number(str);

    return isNaN(result) ? Nothing : Just(result);
};

export const round = (fractionDigits: number, num: number): number => Number(num.toFixed(fractionDigits));
