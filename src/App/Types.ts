import {
    Msg as CounterMsg,
    Model as CounterModel
} from 'App/Counter/Types';
import {
    Msg as TodoMsg,
    Model as TodoModel
} from 'App/Todo/Types';

/**
 * --- MODEL --
 */

export type Model = {
    firstCounter: CounterModel,
    secondCounter: CounterModel,
    todoList: TodoModel
};
export const Model = (
    firstCounter: CounterModel,
    secondCounter: CounterModel,
    todoList: TodoModel
    ): Model => ({
    firstCounter,
    secondCounter,
    todoList
});

/**
 * --- MESSAGES ---
 */

export type Msg
    = FirstCounterMsg
    | SecondCounterMsg
    | TodoListMsg
    ;

export interface FirstCounterMsg {
    type: 'FIRST_COUNTER_MSG';
    payload: CounterMsg;
}
export const FirstCounterMsg = (msg: CounterMsg): FirstCounterMsg => ({
    type: 'FIRST_COUNTER_MSG',
    payload: msg
});

export interface SecondCounterMsg {
    type: 'SECOND_COUNTER_MSG';
    payload: CounterMsg;
}
export const SecondCounterMsg = (msg: CounterMsg): SecondCounterMsg => ({
    type: 'SECOND_COUNTER_MSG',
    payload: msg
});

export interface TodoListMsg {
    type: 'TODO_LIST_MSG';
    payload: TodoMsg;
}
export const TodoListMsg = (msg: TodoMsg): TodoListMsg => ({
    type: 'TODO_LIST_MSG',
    payload: msg
});
