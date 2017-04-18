import {
    Msg as CounterMsg,
    Model as CounterModel
} from './Counter/Types';

/**
 * --- MODEL --
 */

export type Model = {
    firstCounter: CounterModel,
    secondCounter: CounterModel
};

/**
 * --- MESSAGES ---
 */

export type Msg
    = FirstCounterMsg
    | SecondCounterMsg
    ;

export interface FirstCounterMsg {
    type: 'FIRST_COUNTER_MSG';
    payload: CounterMsg;
}
export const FirstCounterMsg = (action: CounterMsg): FirstCounterMsg => ({
    type: 'FIRST_COUNTER_MSG',
    payload: action
});

export interface SecondCounterMsg {
    type: 'SECOND_COUNTER_MSG';
    payload: CounterMsg;
}
export const SecondCounterMsg = (action: CounterMsg): SecondCounterMsg => ({
    type: 'SECOND_COUNTER_MSG',
    payload: action
});
