import React from 'react';
import {
    render
} from 'react-dom';

import {
    ReactProvider
} from './ReactProvider';
import { Cmd } from 'frctl/dist/Core';
import * as App from './App';

const update = (msg: App.Msg, model: App.Model): [ App.Model, Cmd<App.Msg> ] => msg.update(model);

render(
    (
        <ReactProvider
            init={App.init}
            update={update}
            subscriptions={App.subscriptions}
            view={App.View}
        />
    ),
    document.getElementById('app')
);
