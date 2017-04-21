import * as Counter from 'App/Counter/Types';
import * as Todo from 'App/Todo/Types';

/**
 * --- MODEL --
 */

export type Model = {
    firstCounter: Counter.Model,
    secondCounter: Counter.Model,
    todoList: Todo.Model
};
export const Model = (
    firstCounter: Counter.Model,
    secondCounter: Counter.Model,
    todoList: Todo.Model
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
    payload: Counter.Msg;
}
export const FirstCounterMsg = (msg: Counter.Msg): FirstCounterMsg => ({
    type: 'FIRST_COUNTER_MSG',
    payload: msg
});

export interface SecondCounterMsg {
    type: 'SECOND_COUNTER_MSG';
    payload: Counter.Msg;
}
export const SecondCounterMsg = (msg: Counter.Msg): SecondCounterMsg => ({
    type: 'SECOND_COUNTER_MSG',
    payload: msg
});

export interface TodoListMsg {
    type: 'TODO_LIST_MSG';
    payload: Todo.Msg;
}
export const TodoListMsg = (msg: Todo.Msg): TodoListMsg => ({
    type: 'TODO_LIST_MSG',
    payload: msg
});
