import {
    increment
} from './Types';

export const delayedIncrement = (delay) => new Promise((resolve) => {
    const timeoutID = setTimeout(() => {
        clearTimeout(timeoutID);

        resolve(
            increment()
        );
    }, delay);
});
