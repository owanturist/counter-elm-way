import {
    Cmd
} from 'Loop';
import {
    Msg,
    Model
} from './Types';
import {
    delayedIncrement
} from './Cmd';

export const initialModel: Model = 0;

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
                Cmd.butch([
                    delayedIncrement(msg.payload)
                ])
            ];
        }

        default: {
            throw new Error('Msg does not match');
        }
    }
};
