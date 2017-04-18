import {
    Cmd
} from 'Platform/Cmd';
import {
    Msg,
    increment
} from './Types';

const delay = (time: number) => {
    return new Promise<void>((resolve) => {
        const timeoutID = setTimeout(() => {
            clearTimeout(timeoutID);

            resolve();
        }, time);
    });
};

export const delayedIncrement = (time: number): Cmd<Msg> => Cmd.of(
    delay(time).then(() => increment())
);
