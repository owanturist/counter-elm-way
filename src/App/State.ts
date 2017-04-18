import {
    Cmd
} from 'Platform/Cmd';
import {
    Msg,
    Model,
    FirstCounterMsg,
    SecondCounterMsg
} from './Types';
import {
    initialModel as CounterInitialModel,
    initialCmd as CounterInitialCmd,
    update as CoutnerModelUpdate
} from './Counter/State';

export const initialModel: Model = {
    firstCounter: CounterInitialModel,
    secondCounter: CounterInitialModel
};

export const initialCmd = Cmd.butch<Msg>([
    CounterInitialCmd.map(FirstCounterMsg),
    CounterInitialCmd.map(SecondCounterMsg)
]);

export const update = (msg: Msg, model: Model): [ Model, Cmd<Msg>]  => {
    switch (msg.type) {
        case 'FIRST_COUNTER_MSG': {
            const [
                nextFirstCounter,
                counterCmd
            ] = CoutnerModelUpdate(msg.payload, model.firstCounter);

            return [
                {
                    ...model,
                    firstCounter: nextFirstCounter
                },
                counterCmd.map(FirstCounterMsg)
            ];
        }

        case 'SECOND_COUNTER_MSG': {
            const [
                nextSecondCounter,
                counterCmd
            ] = CoutnerModelUpdate(msg.payload, model.secondCounter);

            return [
                {
                    ...model,
                    secondCounter: nextSecondCounter
                },
                counterCmd.map(SecondCounterMsg)
            ];
        }

        default: {
            /**
             * Stub for @@redux/INIT action.
             * It should be placed inside only root update.
             */

            return [ model, Cmd.none() ];
        }
    }
};
