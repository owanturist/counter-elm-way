import {
    Cmd
} from 'Loop';
import {
    Msg,
    increment
} from './Types';

// export const delayedIncrement = (delay: number): Promise<Msg> => new Promise((resolve) => {
//     const timeoutID = setTimeout(() => {
//         clearTimeout(timeoutID);

//         resolve(
//             increment()
//         );
//     }, delay);
// });

export const delayedIncrement = (delay: number) => Cmd.of(
    () => new Promise<Msg>((resolve) => {
        const timeoutID = setTimeout(() => {
            clearTimeout(timeoutID);

            resolve(
                increment()
            );
        }, delay);
    })
);
