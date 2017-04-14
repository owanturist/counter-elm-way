import Inferno from 'inferno';

import {
    decrement,
    scheduleIncrement
} from './Types';

export const View = ({ dispatch, model, delay }) => (
    <div>
        <button onClick={() => dispatch(decrement())}>-</button>
        {model}
        <button onClick={() => dispatch(scheduleIncrement(delay))}>+</button>
    </div>
);
