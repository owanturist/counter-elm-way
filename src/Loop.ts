/**
 * Solution based on:
 * @link https://github.com/redux-loop/redux-loop
 */
import React from 'react';

import {
    Cmd
} from 'Platform/Cmd';

abstract class Executable<T> extends Cmd<T> {
    public static execute<T, R>(fn: (value: T) => R, cmd: Cmd<T>): Promise<R> {
        return Cmd.execute(fn, cmd);
    }
}

export interface Props<Msg, Model> {
    model: Model;
    dispatch(msg: Msg): void;
}

export interface Configuration<Msg, Model> {
    initial: [ Model, Cmd<Msg> ];
    update: (msg: Msg, model: Model) => [ Model, Cmd<Msg> ];
    view: React.StatelessComponent<Props<Msg, Model>>;
}

export class Loop<Msg, Model> extends React.Component<Configuration<Msg, Model>, Model> {
    constructor(props: Configuration<Msg, Model>, context: any) {
        super(props, context);

        const [ initialModel, initialCmd ] = props.initial;

        this.state = initialModel;
        Executable.execute(this.dispatch, initialCmd);
    }

    public render() {
        return React.createElement(
            this.props.view,
            {
                model: this.state,
                dispatch: (msg: Msg): void => {
                    this.dispatch(msg);
                }
            }
        );
    }

    private dispatch = (msg: Msg): Promise<any> => {
        const [ nextModel, cmd ] = this.props.update(msg, this.state);

        if (this.state !== nextModel) {
            this.setState(nextModel);
        }

        return Executable.execute(this.dispatch, cmd);
    }
}
