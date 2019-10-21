import React from 'react';
import styled from 'styled-components';

import { Process, Cmd, Sub } from 'frctl';
import * as Time from 'frctl/Time';
import { Link } from './ReactProvider';

export interface Model {
    count: number;
    auto: boolean;
}

export const init = (count: number): Model => ({
    count,
    auto: false
});

export interface Msg {
    update(model: Model): [ Model, Cmd<Msg> ];
}

class Decrement implements Msg {
    public update(model: Model): [ Model, Cmd<Msg> ] {
        return [
            { ...model, count: model.count - 1 },
            Cmd.none
        ];
    }
}

class Increment implements Msg {
    public update(model: Model): [ Model, Cmd<Msg> ] {
        return [
            { ...model, count: model.count + 1 },
            Cmd.none
        ];
    }
}

class Delayed implements Msg {
    public constructor(private readonly msg: Msg) {}

    public update(model: Model): [ Model, Cmd<Msg> ] {
        return [
            model,
            Process.sleep(1000).perform(() => this.msg)
        ];
    }
}

class SetAuto implements Msg {
    public constructor(private readonly auto: boolean) {}

    public update(model: Model): [ Model, Cmd<Msg> ] {
        return [
            { ...model, auto: this.auto },
            Cmd.none
        ];
    }
}

export const subscription = (model: Model): Sub<Msg> => {
    if (model.auto) {
        return Time.every(100, () => new Increment());
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
}> = ({ model, disabled, dispatch }) => (
    <div>
        <Button
            disabled={disabled}
            onClick={() => dispatch(new Delayed(new Decrement()))}
        >-</Button>
        {model.count}
        <Button
            disabled={disabled}
            onClick={() => dispatch(new Increment())}
        >+</Button>
        <input
            type="checkbox"
            checked={model.auto}
            onChange={event => dispatch(new SetAuto(event.target.checked))}
        />
        <Link href={`/counter/${model.count}`}>Go to /counter/{model.count}</Link>
    </div>
);
