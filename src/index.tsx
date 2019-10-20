import React from 'react';
import {
    render
} from 'react-dom';

import {
    ReactProvider
} from './ReactProvider';
import { Cmd } from 'frctl';
import * as App from './App';

const update = (msg: App.Msg, model: App.Model): [ App.Model, Cmd<App.Msg> ] => msg.update(model);

render(
    (
        <ReactProvider
            flags={{}}
            init={App.init}
            onUrlChange={App.onUrlChange}
            onUrlRequest={App.onUrlRequest}
            update={update}
            subscriptions={App.subscriptions}
            view={App.View}
        />
    ),
    document.getElementById('app')
);
