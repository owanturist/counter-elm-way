import React from 'react';

import {
    Msg,
    Model,
    Decrement,
    ScheduleIncrement
} from './Types';
import Styles from './Styles.css';

export interface View {
    model: Model;
    delay: number;
    dispatch(msg: Msg): void;
}

export const View = ({ dispatch, model, delay }: View): JSX.Element => (
    <div className={Styles.Root}>
        <button
            className={Styles.Button_Rounded}
            onClick={() => dispatch(Decrement())}
        >-</button>
        {model}
        <button
            className={Styles.Button}
            onClick={() => dispatch(ScheduleIncrement(delay))}
        >+</button>
    </div>
);
