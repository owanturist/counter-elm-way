/*
 * --- MODEL ---
 */

export interface Model {
    nextId: number;
    input: string;
    todos: Todo[];
}
export const Model = (nextId: number, input: string, todos: Todo[]): Model => ({
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
}
export const Todo = (id: number, message: string): Todo => ({
    id,
    message
});

/*
 * --- MESSAGES ---
 */

export type Msg
    = ChangeInput
    | CreateTodo
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
