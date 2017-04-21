/**
 * Solution based on:
 * @link https://github.com/redux-loop/redux-loop
 */

import {
    Action,
    Reducer,
    StoreEnhancer,
    createStore,
    compose
} from 'redux';

import {
    Cmd
} from 'Platform/Cmd';
import {
    Loop,
    Update,
    Store
} from './Types';

export function createLoopStore<Model, Msg extends Action>(
    update: Update<Model>,
    [ initialModel, initialCmd ]: Loop<Model, Msg>,
    enhancer?: StoreEnhancer<Model>
    ): Store<Model> {

    let queue: Cmd<Msg> = Cmd.none();

    const liftReducer = (updater: Update<Model>): Reducer<Model> => (model: Model, msg: Msg): Model => {
        const [ state, cmd ] = updater(msg, model);

        queue = Cmd.concat(cmd, queue);

        return state;
    };

    const store = createStore(
        liftReducer(update),
        initialModel,
        enhancer
    );

    const enhancedDispatch = (msg: Msg): Promise<any> => {
        store.dispatch(msg);

        const currentQueue = queue;
        queue = Cmd.none();

        return Cmd.execute(enhancedDispatch, currentQueue);
    };

    Cmd.execute(enhancedDispatch, initialCmd);

    return {
        getState: store.getState,
        subscribe: store.subscribe,
        dispatch: enhancedDispatch,
        replaceReducer: compose(store.replaceReducer, liftReducer)
    };
}
