import {
    FIRST_COUNTER_ACTION,
    SECOND_COUNTER_ACTION
} from './Types';

import * as CounterState from './Counter/State';

export const initialModel = {
    firstCounter: CounterState.initialModel,
    secondCounter: CounterState.initialModel
};

export const update = (msg, model) => {
    switch (msg.type) {
        case FIRST_COUNTER_ACTION: {
            const [
                nextFirstCounter,
                counterCmd
            ] = CounterState.update(msg.payload, model.firstCounter);

            return [
                {
                    ...model,
                    firstCounter: nextFirstCounter
                },
                counterCmd
            ];
        }

        case SECOND_COUNTER_ACTION: {
            const [
                nextSecondCounter,
                counterCmd
            ] = CounterState.update(msg.payload, model.secondCounter);

            return [
                {
                    ...model,
                    secondCounter: nextSecondCounter
                },
                counterCmd
            ];
        }

        default: {
            return [ model, []];
        }
    }
};
