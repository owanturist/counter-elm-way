import {
    Msg as CounterMsg,
    Model as CounterModel
} from 'App/Counter/Types';

/*
 * --- MODEL ---
 */

export interface Model {
    nextId: number;
    input: string;
    todos: Todo[];
}
export const Model = (
    nextId: number,
    input: string,
    todos: Todo[]
    ): Model => ({
    nextId,
    input,
    todos
});

/*
 * --- TODO ---
 */

export interface Todo {
    id: number;
    message: string;
    counter: CounterModel;
}
export const Todo = (
    id: number,
    message: string,
    counter: CounterModel
    ): Todo => ({
    id,
    message,
    counter
});

/*
 * --- MESSAGES ---
 */

export type Msg
    = ChangeInput
    | CreateTodo
    | Counter
    ;

export interface ChangeInput {
    type: 'CHANGE_INPUT';
    payload: string;
}
export const ChangeInput = (value: string): ChangeInput => ({
    type: 'CHANGE_INPUT',
    payload: value
});

export interface CreateTodo {
    type: 'CREATE_TODO';
}
export const CreateTodo = (): CreateTodo => ({
    type: 'CREATE_TODO'
});

export interface Counter {
    type: 'COUNTER';
    payload: {
        id: number;
        counterMsg: CounterMsg
    };
}
export const Counter = (id: number, counterMsg: CounterMsg): Counter => ({
    type: 'COUNTER',
    payload: { id, counterMsg }
});
