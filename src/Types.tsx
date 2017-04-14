import {
    Msg as CounterMsg,
    Model as CounterModel
} from './Counter/Types';

/**
 * --- MESSAGES ---
 */

export type Msg
    = FirstCounterMsg
    | SecondCounterMsg
    ;

type FIRST_COUNTER_MSG = 'FIRST_COUNTER_MSG';
type FirstCounterMsg = {
    type: FIRST_COUNTER_MSG,
    payload: CounterMsg
};

export const firstCounterMsg = (action: CounterMsg): FirstCounterMsg => ({
    type: 'FIRST_COUNTER_MSG',
    payload: action
});

type SECOND_COUNTER_MSG = 'SECOND_COUNTER_MSG';
type SecondCounterMsg = {
    type: SECOND_COUNTER_MSG,
    payload: CounterMsg
};

export const secondCounterMsg = (action: CounterMsg): SecondCounterMsg => ({
    type: 'SECOND_COUNTER_MSG',
    payload: action
});

/**
 * --- MODEL --
 */

export type Model = {
    firstCounter: CounterModel,
    secondCounter: CounterModel
};
