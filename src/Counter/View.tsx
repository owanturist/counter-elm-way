import React from 'react';

import {
    Msg,
    Model,
    decrement,
    scheduleIncrement
} from './Types';

export type View = {
    model: Model,
    delay: number,
    dispatch(m: Msg): void
};

export const View = ({ dispatch, model, delay }: View) => (
    <div>
        <button onClick={() => dispatch(decrement())}>-</button>
        {model}
        <button onClick={() => dispatch(scheduleIncrement(delay))}>+</button>
    </div>
);
