import React from 'react';

import {
    Dispatch
} from 'Platform';
import {
    Cmd
} from 'Platform/Cmd';

import * as Counter from './Counter';

type Filter
    = 'ALL'
    | 'COMPLETED'
    | 'UNCOMPLETED'
    ;

export type Msg
    = { $: 'CHANGE_FILTER', _0: Filter }
    | { $: 'CHANGE_INPUT', _0: string }
    | { $: 'CREATE_TODO' }
    | { $: 'COMPLETE_TODO', _0: number, _1: boolean }
    | { $: 'DELETE_TODO', _0: number }
    | { $: 'COUNTER_MSG', _0: number, _1: Counter.Msg }
    | { $: 'TODO_MSG', _0: number, _1: Msg }
    ;

interface Todo {
    id: number;
    message: string;
    completed: boolean;
    counter: Counter.Model;
    todos: Model;
}

export interface Model {
    nextId: number;
    filter: Filter;
    input: string;
    todos: Todo[];
}

export const initial: [ Model, Cmd<Msg> ] = [
    {
        nextId: 0,
        filter: 'ALL',
        input: '',
        todos: []
    },
    Cmd.none()
];

export const update = (msg: Msg, model: Model): [ Model, Cmd<Msg> ] => {
    switch (msg.$) {
        case 'CHANGE_FILTER': {
            return [
                { ...model, filter: msg._0 },
                Cmd.none()
            ];
        }

        case 'CHANGE_INPUT': {
            return [
                { ...model, input: msg._0 },
                Cmd.none()
            ];
        }

        case 'CREATE_TODO': {
            const [ initialCounterModel, initialCounterCmd ] = Counter.initial;
            const [ initialModel, initialCmd ] = initial;

            const newTodo: Todo = {
                id: model.nextId,
                message: model.input,
                completed: false,
                counter: initialCounterModel,
                todos: initialModel
            };

            return [
                {
                    ...model,
                    nextId: model.nextId + 1,
                    input: '',
                    todos: [ newTodo, ...model.todos ]
                },
                Cmd.batch([
                    initialCounterCmd.map((counterMsg: Counter.Msg): Msg => ({ $: 'COUNTER_MSG', _0: newTodo.id, _1: counterMsg })),
                    initialCmd.map((todoMsg: Msg): Msg => ({ $: 'TODO_MSG', _0: newTodo.id, _1: todoMsg }))
                ])
            ];
        }

        case 'COMPLETE_TODO': {
            const nextTodos: Todo[] = model.todos.map((todo) => {
                if (todo.id !== msg._0) {
                    return todo;
                }

                return {
                    ...todo,
                    completed: msg._1
                };
            });

            return [
                { ...model, todos: nextTodos },
                Cmd.none()
            ];
        }

        case 'DELETE_TODO': {
            const nextTodos: Todo[] = model.todos.filter(
                (todo) => todo.id !== msg._0
            );

            return [
                { ...model, todos: nextTodos },
                Cmd.none()
            ];
        }

        case 'COUNTER_MSG': {
            type Acc = {
                todos: Todo[],
                cmd: Cmd<Msg>
            };

            const { todos, cmd }: Acc = model.todos.reduce(
                (acc: Acc, todo: Todo) => {
                    if (todo.id !== msg._0) {
                        return {
                            ...acc,
                            todos: [ ...acc.todos, todo ]
                        };
                    }

                    const [
                        nextCounterModel,
                        counterCmd
                    ] = Counter.update(msg._1, todo.counter);

                    const nextTodoModel: Todo = {
                        ...todo,
                        counter: nextCounterModel
                    };

                    return {
                        todos: [ ...acc.todos, nextTodoModel ],
                        cmd: counterCmd.map((couterMsg: Counter.Msg): Msg => ({ $: 'COUNTER_MSG', _0: todo.id, _1: couterMsg }))
                    };
                },
                {
                    todos: [],
                    cmd: Cmd.none()
                }
            );

            return [
                { ...model, todos },
                cmd
            ];
        }

        case 'TODO_MSG': {
            type Acc = {
                todos: Todo[],
                cmd: Cmd<Msg>
            };

            const { todos, cmd }: Acc = model.todos.reduce(
                (acc: Acc, todo: Todo) => {
                    if (todo.id !== msg._0) {
                        return {
                            ...acc,
                            todos: [ ...acc.todos, todo ]
                        };
                    }

                    const [
                        nextTodosModel,
                        todoCmd
                    ] = update(msg._1, todo.todos);

                    const nextTodoModel: Todo = {
                        ...todo,
                        todos: nextTodosModel
                    };

                    return {
                        todos: [ ...acc.todos, nextTodoModel ],
                        cmd: todoCmd.map((todoMsg: Msg): Msg => ({ $: 'TODO_MSG', _0: todo.id, _1: todoMsg }))
                    };
                },
                {
                    todos: [],
                    cmd: Cmd.none()
                }
            );

            return [
                { ...model, todos },
                cmd
            ];
        }
    }
};

const filtersList: Filter[] = [ 'ALL', 'COMPLETED', 'UNCOMPLETED' ];

const filterTodos = (filter: Filter) => (todo: Todo): boolean => {
    switch (filter) {
        case 'ALL': {
            return true;
        }

        case 'COMPLETED': {
            return todo.completed;
        }

        case 'UNCOMPLETED': {
            return !todo.completed;
        }
    }
};

const FilterView = ({ dispatch, filters, current }: {
    dispatch: Dispatch<Msg>;
    filters: Filter[];
    current: Filter;
}): JSX.Element => (
    <div>
        {filters.map((filter) => (
            <label key={filter}>
                <input
                    type="radio"
                    checked={filter === current}
                    onChange={() => dispatch({ $: 'CHANGE_FILTER', _0: filter })}
                />
                {filter}
            </label>
        ))}
    </div>
);

const TodoView = ({ dispatch, todo }: {
    dispatch: Dispatch<Msg>;
    todo: Todo;
}): JSX.Element => (
    <li>
        <input
            type="checkbox"
            checked={todo.completed}
            onChange={(event) => dispatch({ $: 'COMPLETE_TODO', _0: todo.id, _1: event.target.checked })}
        />

        <Counter.View
            model={todo.counter}
            dispatch={(msg) => dispatch({ $: 'COUNTER_MSG', _0: todo.id, _1: msg })}
        />

        {todo.message}

        <button
            onClick={() => dispatch({ $: 'DELETE_TODO', _0: todo.id })}
        >
            &times;
        </button>

        <View
            model={todo.todos}
            dispatch={(msg) => dispatch({ $: 'TODO_MSG', _0: todo.id, _1: msg })}
        />
    </li>
);

export const View = ({ dispatch, model }: {
    dispatch: Dispatch<Msg>;
    model: Model;
}): JSX.Element => (
    <div>
        <div>Todo List:</div>

        <form
            action="todo"
            onSubmit={(event) => {
                dispatch({ $: 'CREATE_TODO' });

                event.preventDefault();
            }}
        >
            <FilterView
                filters={filtersList}
                current={model.filter}
                dispatch={dispatch}
            />

            <input
                type="text"
                value={model.input}
                onChange={(event) => dispatch({ $: 'CHANGE_INPUT', _0: event.target.value })}
            />
            <button type="submit">
                Create
            </button>
        </form>

        <ul>
            {model.todos.filter(filterTodos(model.filter)).map((todo: Todo) => (
                <TodoView
                    key={todo.id}
                    todo={todo}
                    dispatch={dispatch}
                />
            ))}
        </ul>
    </div>
);
