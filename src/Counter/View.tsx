import Inferno from 'inferno';

import {
    increment,
    decrement
} from './Types';

export const View = ({ dispatch, model }) => (
    <div>
        <button onClick={() => dispatch(decrement())}>-</button>
        {model}
        <button onClick={() => dispatch(increment())}>+</button>
    </div>
);
