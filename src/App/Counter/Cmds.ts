import {
    Cmd
} from 'Platform/Cmd';
import {
    Msg,
    increment
} from './Types';

const delay = (time: number) => {
    return new Promise<Msg>((resolve) => {
        const timeoutID = setTimeout(() => {
            clearTimeout(timeoutID);

            resolve(
                increment()
            );
        }, time);
    });
};

export const delayedIncrement = (time: number) => Cmd.of(
    delay(time).then(() => increment())
);
