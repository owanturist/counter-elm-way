import React from 'react';
import {
    render
} from 'react-dom';
import {
    Provider,
    connect
} from 'react-redux';

import {
    create
} from 'Store/Create';
import {
    Model
} from 'App/Types';
import {
    initialModel,
    initialCmd
} from 'App/State';
import {
    View as AppView
} from 'App/View';

const store = create([ initialModel, initialCmd ]);
const App = connect((model: Model) => ({ model }))(AppView);

render(
    (
        <Provider store={store}>
            <App />
        </Provider>
    ),
    document.getElementById('app')
);
