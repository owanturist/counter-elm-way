/**
 * Solution based on:
 * @link https://github.com/redux-loop/redux-loop
 */

import {
    Action,
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

    public static execute<T>(cmd: Cmd<T>): Promise<any> {
        return Cmd.execute(cmd);
    }
}

export const createStore = <Msg extends Action, Model>(
    update: Update<Msg, Model>,
    [ initialModel, initialCmd ]: Loop<Msg, Model>,
    enhancer?: StoreEnhancer<Model>
): Store<Msg, Model> => {
    let queue: Cmd<Msg> = Cmd.none();

    const liftReducer = (updater: Update<Msg, Model>): Reducer<Model> => (model: Model, msg: Msg): Model => {
        const [ state, cmd ] = updater(msg, model);

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

        return Executable.execute(currentQueue).then(enhancedDispatch);
    };

    Executable.execute(initialCmd).then(enhancedDispatch);

    return {
        getState: store.getState,
        subscribe: store.subscribe,
        dispatch(msg: Msg): void {
            enhancedDispatch(msg);
        },
        replaceReducer: compose(store.replaceReducer, liftReducer)
    };
};
