import React from 'react';
import {
    compose
} from 'redux';

import {
    Msg,
    Model,
    FirstCounterMsg,
    SecondCounterMsg,
    TodoListMsg
} from './Types';
import {
    View as CounterView
} from './Counter/View';
import {
    View as TodoView
} from './Todo/View';

export type View = {
    model: Model,
    dispatch(msg: Msg): void
};

export const View = ({ dispatch, model }: View) => (
    <div>
        <CounterView
            model={model.firstCounter}
            dispatch={compose(dispatch, FirstCounterMsg)}
            delay={3000}
        />
        <CounterView
            model={model.secondCounter}
            dispatch={compose(dispatch, SecondCounterMsg)}
            delay={1000}
        />
        <TodoView
            model={model.todoList}
            dispatch={compose(dispatch, TodoListMsg)}
        />
    </div>
);
