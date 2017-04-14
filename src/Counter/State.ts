import {
    INCREMENT,
    DECREMENT,
    SCHEDULE_INCREMENT
} from './Types';
import {
    delayedIncrement
} from './Cmd';
import {
    effect
} from '../Store';

export const initialModel = 0;

export const update = (msg, model) => {
    switch (msg.type) {
        case INCREMENT: {
            return [ model + 1, []];
        }

        case DECREMENT: {
            return [ model - 1, []];
        }

        case SCHEDULE_INCREMENT: {
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
