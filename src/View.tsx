import Inferno from 'inferno';

import {
    firstCounterAction,
    secondCounterAction
} from './Types';
import {
    View as CounterView
} from './Counter/View';

export const View = ({ dispatch, model }) => (
    <div>
        <CounterView
            model={model.firstCounter}
            dispatch={(action) => dispatch(firstCounterAction(action))}
            delay={3000}
        />
        <CounterView
            model={model.secondCounter}
            dispatch={(action) => dispatch(secondCounterAction(action))}
            delay={1000}
        />
    </div>
);
