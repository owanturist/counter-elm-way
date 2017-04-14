import Inferno from 'inferno';
import {
    Provider,
    connect
} from 'inferno-redux';

import {
    createLoopStore
} from './Loop';
import {
    Msg,
    Model
} from './Types';
import {
    initialModel,
    update
} from './State';
import {
    View as AppView
} from './View';

const store = createLoopStore<Model, Msg>((state, action: Msg) => {
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
