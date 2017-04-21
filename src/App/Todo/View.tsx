import React from 'react';

import {
    View as CounterView
} from 'App/Counter/View';
import {
    Msg,
    Model,
    Todo,
    ChangeInput,
    CreateTodo,
    Counter
} from './Types';


export type Dispatch = (msg: Msg) => void;

export interface View {
    model: Model;
    dispatch: Dispatch;
}

export const View = ({ dispatch, model }: View) => (
    <div>
        <h1>Todo List:</h1>

        <form
            action="todo"
            onSubmit={(event) => {
                dispatch(CreateTodo());

                event.preventDefault();
            }}
        >
            <input
                type="text"
                value={model.input}
                onChange={(event) => dispatch(ChangeInput(event.target.value))}
            />
            <button type="submit">
                Create
            </button>
        </form>

        <ul>
            {model.todos.map((todo: Todo) => (
                <li key={todo.id}>
                    <p>{todo.message}</p>

                    <CounterView
                        model={todo.counter}
                        delay={1000}
                        dispatch={(msg) => dispatch(Counter(todo.id, msg))}
                    />
                </li>
            ))}
        </ul>
    </div>
);
