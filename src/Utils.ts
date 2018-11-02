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
    if (str.trim() === '') {
        return Nothing;
    }

    const result = Number(str);

    return isNaN(result) ? Nothing : Just(result);
};

export const round = (fractionDigits: number, num: number): number => Number(num.toFixed(fractionDigits));

export const clamp = (low: number, high: number, value: number): number => {
    const [ low_, high_ ] = low < high ? [ low, high ] : [ high, low ];

    if (value < low_) {
        return low_;
    }

    if (value > high_) {
        return high_;
    }

    return value;
};
