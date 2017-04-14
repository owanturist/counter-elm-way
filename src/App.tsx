import React from 'react';
import {
    render
} from 'react-dom';
import {
    Store
} from 'redux';
import {
    Provider,
    connect
} from 'react-redux';

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
}) as Store<any>;

const App = connect((model) => ({ model }))(AppView);

render(
    (
        <Provider store={store}>
            <App />
        </Provider>
    ),
    document.getElementById('app')
);
