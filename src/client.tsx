import React from 'react';
import {
    render
} from 'react-dom';

import * as Loop from 'Loop';

import {
    initialCmd,
    initialModel,
    update
} from 'App/State';
import {
    View
} from 'App/View';

render(
    (
        <Loop.Provider
            initial={[ initialModel, initialCmd ]}
            update={update}
            view={View}
        />
    ),
    document.getElementById('app')
);
