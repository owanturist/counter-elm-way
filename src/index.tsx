import React from 'react';
import {
    render
} from 'react-dom';

import {
    ReactProvider
} from './ReactProvider';
import * as App from './App';

render(
    (
        <ReactProvider
            flags
            init={App.init}
            update={App.update}
            subscriptions={App.subscriptions}
            view={App.View}
        />
    ),
    document.getElementById('app')
);
