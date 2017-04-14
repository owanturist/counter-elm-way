import React from 'react';

import {
    Msg,
    Model,
    firstCounterMsg,
    secondCounterMsg
} from './Types';
import {
    View as CounterView
} from './Counter/View';

export type View = {
    model: Model,
    dispatch(m: Msg): void
};

export const View = ({ dispatch, model }: View) => (
    <div>
        <CounterView
            model={model.firstCounter}
            dispatch={(action) => dispatch(firstCounterMsg(action))}
            delay={3000}
        />
        <CounterView
            model={model.secondCounter}
            dispatch={(action) => dispatch(secondCounterMsg(action))}
            delay={1000}
        />
    </div>
);
