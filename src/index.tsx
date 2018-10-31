import React from 'react';
import {
    render
} from 'react-dom';

import * as Platform from 'Fractal/Platform';
import {
    Cmd
} from 'Fractal/Platform/Cmd';

import {
    Currency
} from './Currency';
import * as App from 'App';

const init = (): [ App.Model, Cmd<App.Msg>] => App.init(
    Currency.of('USD', '$', 25.51),
    Currency.of('EUR', '€', 116.12),
    [
        Currency.of('GBP', '£', 58.33)
    ]
);
const update = (msg: App.Msg, model: App.Model): [ App.Model, Cmd<App.Msg> ] => msg.update(model);

render(
    (
        <Platform.Application
            init={init}
            update={update}
            subscriptions={App.subscriptions}
            view={App.View}
        />
    ),
    document.getElementById('app')
);
