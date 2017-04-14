import {
    Model,
    Msg
} from './Types';
import {
    delayedIncrement
} from './Cmd';
import {
    Effect,
    effect
} from '../Store';

export const initialModel: Model = 0;

export const update = (msg: Msg, model: Model): [ Model, Effect<Msg>[] ] => {
    switch (msg.type) {
        case 'INCREMENT': {
            return [ model + 1, []];
        }

        case 'DECREMENT': {
            return [ model - 1, []];
        }

        case 'SCHEDULE_INCREMENT': {
            return [
                model,
                [
                    effect(delayedIncrement, msg.payload)
                ]
            ];
        }

        default: {
            throw new Error('Msg does not match');
        }
    }
};
