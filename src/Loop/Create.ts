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
    [ initialModel, initialCmds ]: Loop<Model, Msg>,
    enhancer?: StoreEnhancer<Model>
    ): Store<Model> {

    let queue: Cmd<Msg> = Cmd.none();

    const liftReducer = (updater: Update<Model>): Reducer<Model> => (model: Model, msg: Msg): Model => {
        const [ state, cmds ] = updater(msg, model);

        queue = queue.concat(cmds);

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

        return currentQueue.execute(enhancedDispatch);
    };

    initialCmds.execute(enhancedDispatch);

    return {
        getState: store.getState,
        subscribe: store.subscribe,
        dispatch: enhancedDispatch,
        replaceReducer: compose(store.replaceReducer, liftReducer)
    };
}
