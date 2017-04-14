import {
    INCREMENT,
    DECREMENT
} from './Types';

export const initialModel = 0;

export const update = (msg, model) => {
    switch (msg.type) {
        case INCREMENT: {
            return [ model + 1, []];
        }

        case DECREMENT: {
            return [ model - 1, []];
        }

        default: {
            throw new Error('Msg does not match');
        }
    }
};
