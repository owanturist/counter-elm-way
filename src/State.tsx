import {
    FIRST_COUNTER_ACTION,
    SECOND_COUNTER_ACTION,
    firstCounterAction,
    secondCounterAction
} from './Types';

import {
    initialModel as CounterInitialModel,
    update as CoutnerModelUpdate
} from './Counter/State';

export const initialModel = {
    firstCounter: CounterInitialModel,
    secondCounter: CounterInitialModel
};

export const update = (msg, model) => {
    switch (msg.type) {
        case FIRST_COUNTER_ACTION: {
            const [
                nextFirstCounter,
                counterCmd
            ] = CoutnerModelUpdate(msg.payload, model.firstCounter);

            return [
                {
                    ...model,
                    firstCounter: nextFirstCounter
                },
                counterCmd.map(
                    (eff) => eff.map(firstCounterAction)
                )
            ];
        }

        case SECOND_COUNTER_ACTION: {
            const [
                nextSecondCounter,
                counterCmd
            ] = CoutnerModelUpdate(msg.payload, model.secondCounter);

            return [
                {
                    ...model,
                    secondCounter: nextSecondCounter
                },
                counterCmd.map(
                    (eff) => eff.map(secondCounterAction)
                )
            ];
        }

        default: {
            return [ model, []];
        }
    }
};
