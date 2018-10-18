import React from 'react';

import {
    Dispatch
} from 'Fractal/Platform';
import {
    Task
} from 'Fractal/Task';
import {
    Cmd
} from 'Fractal/Platform/Cmd';
import {
    Sub
} from 'Fractal/Platform/Sub';
import * as Time from 'Fractal/Time';
import * as Process from 'Fractal/Process';

export type Msg
    = { $: 'DECREMENT' }
    | { $: 'INCREMENT' }
    | { $: 'DELAYED'; _0: Msg }
    | { $: 'SET_AUTO'; _0: boolean }
    ;

export interface Model {
    count: number;
    auto: boolean;
}

export const init = (count: number): [ Model, Cmd<Msg> ] => [
    {
        count,
        auto: false
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

        case 'DELAYED': {
            return [
                model,
                Task.perform(() => msg._0, Process.sleep(1000))
            ];
        }

        case 'SET_AUTO': {
            return [
                { ...model, auto: msg._0 },
                Cmd.none()
            ];
        }
    }
};

export const subscription = (model: Model): Sub<Msg> => {
    if (model.auto) {
        return Time.every(100, (): Msg => ({ $: 'INCREMENT' }));
    }

    return Sub.none();
};

export const View = ({ dispatch, model, ...props }: {
    dispatch: Dispatch<Msg>;
    model: Model;
    disabled?: boolean;
}): JSX.Element => (
    <div>
        <button
            disabled={props.disabled}
            onClick={() => dispatch({ $: 'DELAYED', _0: { $: 'DECREMENT' }})}
        >-</button>
        {model.count}
        <button
            disabled={props.disabled}
            onClick={() => dispatch({ $: 'INCREMENT' })}
        >+</button>
        <input
            type="checkbox"
            checked={model.auto}
            onChange={event => dispatch({ $: 'SET_AUTO', _0: event.target.checked })}
        />
    </div>
);
