import React from 'react';

import {
    Dispatch
} from 'Platform';
import {
    Cmd
} from 'Platform/Cmd';

export type Msg
    = { $: 'DECREMENT' }
    | { $: 'INCREMENT' }
    ;

export interface Model {
    count: number;
}

export const initial: [ Model, Cmd<Msg> ] = [
    {
        count: 0
    },
    Cmd.none()
];

export const update = (msg: Msg, model: Model): [ Model, Cmd<Msg> ] => {
    switch (msg.$) {
        case 'DECREMENT': {
            return [
                { ...model, count: model.count - 1 },
                Cmd.none()
            ];
        }

        case 'INCREMENT': {
            return [
                { ...model, count: model.count + 1 },
                Cmd.none()
            ];
        }
    }
};

export const View = ({ dispatch, model }: {
    dispatch: Dispatch<Msg>;
    model: Model;
}) => (
    <div>
        <button onClick={() => dispatch({ $: 'DECREMENT' })}>-</button>
        {model.count}
        <button onClick={() => dispatch({ $: 'INCREMENT' })}>+</button>
    </div>
);
