import {
    Cmd
} from 'Loop/Loop';
import {
    Msg,
    Model,
    firstCounterMsg,
    secondCounterMsg
} from './Types';
import {
    initialModel as CounterInitialModel,
    update as CoutnerModelUpdate
} from './Counter/State';

export const initialModel: Model = {
    firstCounter: CounterInitialModel,
    secondCounter: CounterInitialModel
};

export const update = (msg: Msg, model: Model): [ Model, Cmd<Msg>]  => {
    switch (msg.type) {
        case 'FIRST_COUNTER_MSG': {
            const [
                nextFirstCounter,
                counterCmds
            ] = CoutnerModelUpdate(msg.payload, model.firstCounter);

            return [
                {
                    ...model,
                    firstCounter: nextFirstCounter
                },
                counterCmds.map(firstCounterMsg)
            ];
        }

        case 'SECOND_COUNTER_MSG': {
            const [
                nextSecondCounter,
                counterCmds
            ] = CoutnerModelUpdate(msg.payload, model.secondCounter);

            return [
                {
                    ...model,
                    secondCounter: nextSecondCounter
                },
                counterCmds.map(secondCounterMsg)
            ];
        }

        default: {
            return [ model, Cmd.none()];
        }
    }
};
