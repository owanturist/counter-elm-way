import React from 'react';
import {
    compose
} from 'redux';

import * as Counter from 'App/Counter/View';
import {
    Msg,
    Model,
    Todo,
    Filter,
    ChangeFilter,
    ChangeInput,
    CreateTodo,
    CompleteTodo,
    DeleteTodo,
    CounterMsg
} from './Types';

export type Dispatch = (msg: Msg) => void;

export interface View {
    model: Model;
    dispatch: Dispatch;
}

const filtersList: Filter[] = [ 'All', 'Completed', 'Uncompleted' ];

const filterTodos = (filter: Filter) => (todo: Todo): boolean => {
    switch (filter) {
        case 'All': {
            return true;
        }

        case 'Completed': {
            return todo.completed;
        }

        case 'Uncompleted': {
            return !todo.completed;
        }
    }
};

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
            <FilterView
                filters={filtersList}
                value={model.filter}
                dispatch={dispatch}
            />

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

interface FilterView {
    filters: Filter[];
    value: Filter;
    dispatch: Dispatch;
}

const FilterView = ({ dispatch, filters, value }: FilterView) => (
    <div>
        {filters.map((filter) => (
            <label key={filter}>
                <input
                    type="radio"
                    checked={filter === value}
                    onChange={() => dispatch(ChangeFilter(filter))}
                />
                {filter}
            </label>
        ))}
    </div>
);

interface TodoView {
    todo: Todo;
    dispatch: Dispatch;
}

const TodoView = ({ dispatch, todo }: TodoView) => (
    <li>
        <input
            type="checkbox"
            checked={todo.completed}
            onChange={(event) => dispatch(CompleteTodo(todo.id, event.target.checked))}
        />

        <Counter.View
            model={todo.counter}
            delay={1000}
            dispatch={compose(dispatch, CounterMsg(todo.id))}
        />

        {todo.message}

        <button
            onClick={() => dispatch(DeleteTodo(todo.id))}
        >
            &times;
        </button>
    </li>
);
