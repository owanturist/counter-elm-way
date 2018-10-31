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

export const clamp = (low: number, high: number, value: number): number => {
    if (value < low) {
        return low;
    }

    if (value > high) {
        return high;
    }

    return value;
};
