import Inferno from 'inferno';

import {
    firstCounterAction,
    secondCounterAction
} from './Types';
import * as CounterView from './Counter/View';

export const View = ({ dispatch, model }) => (
    <div>
        <CounterView.View
            model={model.firstCounter}
            dispatch={(action) => dispatch(firstCounterAction(action))}
        />
        <CounterView.View
            model={model.secondCounter}
            dispatch={(action) => dispatch(secondCounterAction(action))}
        />
    </div>
);
