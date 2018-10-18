import React from 'react';
import {
    render
} from 'react-dom';

import * as Platform from 'Fractal/Platform';

import * as App from 'App';

render(
    (
        <Platform.Application
            init={App.init}
            update={App.update}
            subscriptions={App.subscriptions}
            view={App.View}
        />
    ),
    document.getElementById('app')
);
