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

export const filterMap = <T, R>(predicate: (value: T) => Maybe<R>, arr: Array<T>): Array<R> => {
    const result: Array<R> = [];

    for (const item of arr) {
        predicate(item).cata({
            Nothing: () => {
                // do nothing
            },
            Just: (value: R) => {
                result.push(value);
            }
        });
    }

    return result;
};

export const round = (fractionDigits: number, num: number): number => Number(num.toFixed(fractionDigits));
