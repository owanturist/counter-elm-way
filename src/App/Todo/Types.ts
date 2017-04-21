import * as Counter from 'App/Counter/Types';

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
    completed: boolean;
    counter: Counter.Model;
}
export const Todo = (
    id: number,
    message: string,
    completed: boolean,
    counter: Counter.Model
    ): Todo => ({
    id,
    message,
    completed,
    counter
});

/*
 * --- MESSAGES ---
 */

export type Msg
    = ChangeInput
    | CreateTodo
    | CounterMsg
    | CompleteTodo
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

export interface CompleteTodo {
    type: 'COMPLETE_TODO';
    payload: {
        id: number;
        completed: boolean;
    };
}

export const CompleteTodo = (id: number, completed: boolean): CompleteTodo => ({
    type: 'COMPLETE_TODO',
    payload: { id, completed }
});

export interface CounterMsg {
    type: 'COUNTER_MSG';
    payload: {
        id: number;
        msg: Counter.Msg
    };
}
export const CounterMsg = (id: number) => (msg: Counter.Msg): CounterMsg => ({
    type: 'COUNTER_MSG',
    payload: { id, msg }
});
