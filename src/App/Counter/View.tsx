import React from 'react';

import {
    Msg,
    Model,
    Decrement,
    ScheduleIncrement
} from './Types';

export interface View {
    model: Model;
    delay: number;
    dispatch(msg: Msg): void;
}

export const View = ({ dispatch, model, delay }: View): JSX.Element => (
    <div>
        <button onClick={() => dispatch(Decrement())}>-</button>
        {model}
        <button onClick={() => dispatch(ScheduleIncrement(delay))}>+</button>
    </div>
);
