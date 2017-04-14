import {
    Msg,
    increment
} from './Types';

export const delayedIncrement = (delay: number): Promise<Msg> => new Promise((resolve) => {
    const timeoutID = setTimeout(() => {
        clearTimeout(timeoutID);

        resolve(
            increment()
        );
    }, delay);
});
