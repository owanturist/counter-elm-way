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

export const View = ({ dispatch, model, ...props }: {
    dispatch: Dispatch<Msg>;
    model: Model;
    disabled?: boolean;
}): JSX.Element => (
    <div>
        <button
            disabled={props.disabled}
            onClick={() => dispatch({ $: 'DECREMENT' })}
        >-</button>
        {model.count}
        <button
            disabled={props.disabled}
            onClick={() => dispatch({ $: 'INCREMENT' })}
        >+</button>
    </div>
);
