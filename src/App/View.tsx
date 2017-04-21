import React from 'react';
import {
    compose
} from 'redux';

import {
    View as CounterView
} from 'App/Counter/View';
import {
    View as TodoView
} from 'App/Todo/View';
import {
    Msg,
    Model,
    FirstCounterMsg,
    SecondCounterMsg,
    TodoListMsg
} from './Types';

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
