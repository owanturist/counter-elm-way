import Inferno from 'inferno';
import {
    Provider,
    connect
} from 'inferno-redux';

import {
    createLoopStore
} from './Loop';
import {
    initialModel,
    update
} from './State';
import {
    View as AppView
} from './View';

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

const App = connect((model) => ({ model }))(AppView);

Inferno.render(
    (
        <Provider store={store}>
            <App />
        </Provider>
    ),
    document.getElementById('app')
);
