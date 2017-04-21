import React from 'react';
import {
    compose
} from 'redux';

import * as Counter from 'App/Counter/View';
import * as Todo from 'App/Todo/View';
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
        <Counter.View
            model={model.firstCounter}
            dispatch={compose(dispatch, FirstCounterMsg)}
            delay={3000}
        />
        <Counter.View
            model={model.secondCounter}
            dispatch={compose(dispatch, SecondCounterMsg)}
            delay={1000}
        />
        <Todo.View
            model={model.todoList}
            dispatch={compose(dispatch, TodoListMsg)}
        />
    </div>
);
