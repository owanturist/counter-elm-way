import {
    Effect,
    effect
} from '../Loop';
import {
    Msg,
    Model
} from './Types';
import {
    delayedIncrement
} from './Cmd';

export const initialModel: Model = 0;

export const update = (msg: Msg, model: Model): [ Model, Array<Effect<Msg>> ] => {
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