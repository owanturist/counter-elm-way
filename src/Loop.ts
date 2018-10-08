/**
 * Solution based on:
 * @link https://github.com/redux-loop/redux-loop
 */
import React from 'react';
import {
    Action,
    DeepPartial,
    Reducer,
    Unsubscribe,
    StoreEnhancer,
    createStore as createReduxStore,
    compose
} from 'redux';

import {
    Cmd
} from 'Platform/Cmd';

export type Loop<Msg, Model> = [ Model, Cmd<Msg> ];

export type Update<Msg, Model> = (msg: Msg, model: Model) => Loop<Msg, Model>;

export interface Store<Msg extends Action, Model> {
    dispatch(msg: Msg): void;
    getState(): Model;
    subscribe(listener: () => void): Unsubscribe;
    replaceReducer(nextUpdate: Update<Msg, Model>): void;
}

abstract class Executable<T> extends Cmd<T> {
    public static concat<T>(left: Cmd<T>, right: Cmd<T>): Cmd<T> {
        return Cmd.concat(left, right);
    }

    public static execute<T, R>(fn: (value: T) => R, cmd: Cmd<T>): Promise<R> {
        return Cmd.execute(fn, cmd);
    }
}

export const createStore = <Msg extends Action, Model extends DeepPartial<Model>>(
    update: Update<Msg, Model>,
    initial: Loop<Msg, Model>,
    enhancer?: StoreEnhancer<Model>
): Store<Msg, Model> => {
    const [ initialModel, initialCmd ] = initial;
    let queue: Cmd<Msg> = Cmd.none();

    const liftReducer = (updater: Update<Msg, Model>): Reducer<Model> => (model: Model, msg: Msg): Model => {
        const [ state, cmd ] = updater(msg, model) || initial;

        queue = Executable.concat(cmd, queue);

        return state;
    };

    const store = createReduxStore(
        liftReducer(update),
        initialModel,
        enhancer
    );

    const enhancedDispatch = (msg: Msg): Promise<any> => {
        store.dispatch(msg);

        const currentQueue = queue;
        queue = Cmd.none();

        return Executable.execute(enhancedDispatch, currentQueue);
    };

    Executable.execute(enhancedDispatch, initialCmd);

    return {
        getState: store.getState,
        subscribe: store.subscribe,
        dispatch(msg: Msg): void {
            enhancedDispatch(msg);
        },
        replaceReducer: compose(store.replaceReducer, liftReducer)
    };
};

export interface Props<Msg extends Action, Model> {
    model: Model;
    dispatch(msg: Msg): void;
}

export interface ProviderProps<Msg extends Action, Model> {
    initial: Loop<Msg, Model>;
    update: Update<Msg, Model>;
    view: React.StatelessComponent<Props<Msg, Model>>;
}

export class Provider<Msg extends Action, Model extends DeepPartial<Model>> extends React.Component<ProviderProps<Msg, Model>, Model> {
    private store: Store<Msg, Model>;

    constructor(props: ProviderProps<Msg, Model>, context: any) {
        super(props, context);

        this.store = createStore(this.props.update, this.props.initial);

        this.state = this.store.getState();
        this.store.subscribe(this.subscribe);
    }

    public render() {
        return React.createElement(
            this.props.view,
            {
                model: this.state,
                dispatch: this.dispatch
            }
        );
    }

    private dispatch = (msg: Msg): void => {
        this.store.dispatch(msg);
    }

    private subscribe = (): void => {
        const nextState = this.store.getState();

        if (this.state !== nextState) {
            this.setState(nextState);
        }
    }
}
