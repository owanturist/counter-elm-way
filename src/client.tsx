import React from 'react';
import {
    render
} from 'react-dom';

import * as Platform from 'Platform';

import * as App from 'App';

render(
    (
        <Platform.Application
            initial={App.init()}
            update={App.update}
            view={App.View}
        />
    ),
    document.getElementById('app')
);
