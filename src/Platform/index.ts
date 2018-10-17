/**
 * Solution based on:
 * @link https://github.com/redux-loop/redux-loop
 */
import React from 'react';

import {
    Encoder
} from 'Json/Encode';
import {
    Cmd
} from './Cmd';

export type Subscription<T> = Readonly<{
    namespace: string;
    key: Encoder;
    executor(): () => void;
    tagger(dispatch: (msg: T) => void): void;
}>;

abstract class InternalCmd<M> extends Cmd<M> {
    public static execute<M, R>(fn: (msg: M) => R, cmd: Cmd<M>): Promise<any> {
        return Cmd.execute(fn, cmd);
    }
}

export type Dispatch<Msg> = (msg: Msg) => void;

export interface Configuration<Msg, Model> {
    view: React.StatelessComponent<{
        dispatch: Dispatch<Msg>;
        model: Model;
    }>;
    init(): [ Model, Cmd<Msg> ];
    update(msg: Msg, model: Model): [ Model, Cmd<Msg> ];
}

export class Application<Msg, Model> extends React.Component<Configuration<Msg, Model>, Model> {
    constructor(props: Configuration<Msg, Model>, context: any) {
        super(props, context);

        const [ initialModel, initialCmd ] = props.init();

        this.state = initialModel;
        InternalCmd.execute(this.dispatch, initialCmd);
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

    private readonly dispatch = (msg: Msg): Promise<any> => {
        const [ nextModel, cmd ] = this.props.update(msg, this.state);

        if (this.state !== nextModel) {
            this.setState(nextModel);
        }

        return InternalCmd.execute(this.dispatch, cmd);
    }
}
