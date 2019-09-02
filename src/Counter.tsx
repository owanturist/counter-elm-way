import React from 'react';
import styled from 'styled-components';

import {
    Cmd
} from 'frctl/dist/Platform/Cmd';
import {
    Sub
} from 'frctl/dist/Platform/Sub';
import * as Time from 'frctl/dist/Time';
import {
    Process
} from 'frctl/dist/Process';

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
    Cmd.none
];

export const update = (msg: Msg, model: Model): [ Model, Cmd<Msg> ] => {
    switch (msg.$) {
        case 'DECREMENT': {
            return [
                { ...model, count: model.count - 1 },
                Cmd.none
            ];
        }

        case 'INCREMENT': {
            return [
                { ...model, count: model.count + 1 },
                Cmd.none
            ];
        }

        case 'DELAYED': {
            return [
                model,
                Process.sleep(1000).perform(() => msg._0)
            ];
        }

        case 'SET_AUTO': {
            return [
                { ...model, auto: msg._0 },
                Cmd.none
            ];
        }
    }
};

export const subscription = (model: Model): Sub<Msg> => {
    if (model.auto) {
        return Time.every(100, (): Msg => ({ $: 'INCREMENT' }));
    }

    return Sub.none;
};

const Button = styled.button`
    border: 1px solid red;
    font-size: 20px;
`;

export const View: React.StatelessComponent<{
    model: Model;
    disabled?: boolean;
    dispatch(msg: Msg): void;
}> = ({ dispatch, model, ...props }) => (
    <div>
        <Button
            disabled={props.disabled}
            onClick={() => dispatch({ $: 'DELAYED', _0: { $: 'DECREMENT' }})}
        >-</Button>
        {model.count}
        <Button
            disabled={props.disabled}
            onClick={() => dispatch({ $: 'INCREMENT' })}
        >+</Button>
        <input
            type="checkbox"
            checked={model.auto}
            onChange={event => dispatch({ $: 'SET_AUTO', _0: event.target.checked })}
        />
    </div>
);
