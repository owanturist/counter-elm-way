import React from 'react';
import {
    render
} from 'react-dom';
import {
    Provider,
    connect
} from 'react-redux';

import {
    createLoopStore
} from 'Loop';
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

const store = createLoopStore<Model, Msg>(update, [ initialModel, []]);
const App = connect((model: Model) => ({ model }))(AppView);

render(
    (
        <Provider store={store}>
            <App />
        </Provider>
    ),
    document.getElementById('app')
);
