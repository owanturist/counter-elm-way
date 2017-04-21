import * as Counter from 'App/Counter/Types';

/*
 * --- MODEL ---
 */

export interface Model {
    nextId: number;
    filter: Filter;
    input: string;
    todos: Todo[];
}
export const Model = (
    nextId: number,
    filter: Filter,
    input: string,
    todos: Todo[]
    ): Model => ({
    nextId,
    filter,
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
    todos: Model;
}
export const Todo = (
    id: number,
    message: string,
    completed: boolean,
    counter: Counter.Model,
    todos: Model
    ): Todo => ({
    id,
    message,
    completed,
    counter,
    todos
});

/*
 * --- FILTRES ---
 */

export type Filter
    = 'All'
    | 'Completed'
    | 'Uncompleted'
    ;

/*
 * --- MESSAGES ---
 */

export type Msg
    = ChangeFilter
    | ChangeInput
    | CreateTodo
    | CompleteTodo
    | DeleteTodo
    | CounterMsg
    | TodosMsg
    ;

export interface ChangeFilter {
    type: 'CHANGE_FILTER';
    payload: Filter;
}
export const ChangeFilter = (filter: Filter): ChangeFilter => ({
    type: 'CHANGE_FILTER',
    payload: filter
});

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

export interface DeleteTodo {
    type: 'DELETE_TODO';
    payload: number;
}
export const DeleteTodo = (id: number): DeleteTodo => ({
    type: 'DELETE_TODO',
    payload: id
});

export interface CounterMsg {
    type: 'COUNTER_MSG';
    payload: {
        id: number;
        msg: Counter.Msg;
    };
}
export const CounterMsg = (id: number) => (msg: Counter.Msg): CounterMsg => ({
    type: 'COUNTER_MSG',
    payload: { id, msg }
});

export interface TodosMsg {
    type: 'TODOS_MSG';
    payload: {
        id: number;
        msg: Msg;
    };
}
export const TodosMsg = (id: number) => (msg: Msg): TodosMsg => ({
    type: 'TODOS_MSG',
    payload: { id, msg }
});
