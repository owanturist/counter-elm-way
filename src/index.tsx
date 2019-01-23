import React from 'react';
import {
    render
} from 'react-dom';

import {
    ReactProvider
} from 'Fractal/ReactProvider';
import * as App from './App';

render(
    (
        <ReactProvider
            flags={null}
            init={App.init}
            update={App.update}
            subscriptions={App.subscriptions}
            view={App.View}
        />
    ),
    document.getElementById('app')
);
