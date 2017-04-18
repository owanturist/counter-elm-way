import {
    Cmd
} from 'Platform/Cmd';
import {
    Msg,
    Model
} from './Types';
import {
    delayedIncrement
} from './Cmds';

export const initialModel: Model = 0;

export const initialCmd = Cmd.none<Msg>();

export const update = (msg: Msg, model: Model): [ Model, Cmd<Msg> ] => {
    switch (msg.type) {
        case 'INCREMENT': {
            return [ model + 1, Cmd.none()];
        }

        case 'DECREMENT': {
            return [ model - 1, Cmd.none()];
        }

        case 'SCHEDULE_INCREMENT': {
            return [
                model,
                delayedIncrement(msg.payload)
            ];
        }
    }
};
