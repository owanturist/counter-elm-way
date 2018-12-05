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

export const floor = (precision: number, num: number): number => {
    const precision_ = clamp(0, 10, precision);

    return Number(
        Math.floor(Number(`${num}e${precision_}`)) + `e-${precision_}`
    );
};

export const ceil = (precision: number, num: number): number => {
    const precision_ = clamp(0, 10, precision);

    return Number(
        Math.ceil(Number(`${num}e${precision_}`)) + `e-${precision_}`
    );
};

export const round = (precision: number, num: number): number => {
    const precision_ = clamp(0, 10, precision);

    return Number(
        Math.round(Number(`${num}e${precision_}`)) + `e-${precision_}`
    );
};

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
