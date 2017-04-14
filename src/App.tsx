import Inferno from 'inferno';
import {
    Provider,
    connect
} from 'inferno-redux';

import {
    createLoopStore
} from './Store';
import {
    initialModel,
    update
} from './State';
import * as AppView from './View';

const store = createLoopStore((state, action) => {
    const [ model, cmds ] = update(action, state);

    return {
        state: model,
        effects: cmds
    };
}, {
    state: initialModel,
    effects: []
});

const App = connect((model) => ({ model }))(AppView.View);

Inferno.render(
    (
        <Provider store={store}>
            <App />
        </Provider>
    ),
    document.getElementById('app')
);
