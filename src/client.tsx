import React from 'react';
import {
    render
} from 'react-dom';
import {
    Provider,
    connect
} from 'react-redux';
import 'normalize.css';

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
    View
} from 'App/View';

const store = create([ initialModel, initialCmd ]);
const App = connect((model: Model) => ({ model }))(View);

render(
    (
        <Provider store={store}>
            <App />
        </Provider>
    ),
    document.getElementById('app')
);
