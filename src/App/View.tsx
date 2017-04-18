import React from 'react';
import {
    compose
} from 'redux';

import {
    Msg,
    Model,
    FirstCounterMsg,
    SecondCounterMsg
} from './Types';
import {
    View as CounterView
} from './Counter/View';

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
    </div>
);
