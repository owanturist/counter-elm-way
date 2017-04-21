import React from 'react';
import {
    compose
} from 'redux';

import * as Counter from 'App/Counter/View';
import {
    Msg,
    Model,
    Todo,
    ChangeInput,
    CreateTodo,
    CounterMsg
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
                    <Counter.View
                        model={todo.counter}
                        delay={1000}
                        dispatch={compose(dispatch, CounterMsg(todo.id))}
                    />

                    {todo.message}
                </li>
            ))}
        </ul>
    </div>
);
