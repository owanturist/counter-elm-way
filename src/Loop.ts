// COPY FROM https://github.com/redux-loop/redux-loop

import {
    Action,
    Reducer,
    Dispatch,
    Unsubscribe,
    StoreEnhancer,
    createStore,
    compose
} from 'redux';

export type Loop<Model, Msg> = [
    Model,
    Array<Cmd<Msg>>
];

export type Update<Model> = <Msg extends Action>(msg: Msg, model: Model) => Loop<Model, Msg>;

export type Store<Model> = {
    dispatch: Dispatch<Model>,
    getState(): Model,
    subscribe(listener: () => void): Unsubscribe,
    replaceReducer(nextReducer: Update<Model>): void
};

export function createLoopStore<Model, Msg extends Action>(
    update: Update<Model>,
    [ initialModel, initialCmds ]: Loop<Model, Msg>,
    enhancer?: StoreEnhancer<Model>
    ): Store<Model> {

    let queue: Array<Cmd<Msg>> = [];

    const liftReducer = (updater: Update<Model>): Reducer<Model> => (model: Model, msg: Msg): Model => {
        const [ state, cmd ] = updater(msg, model);

        cmd.forEach((effect) => queue.push(effect));

        return state;
    };

    const store = createStore(
        liftReducer(update),
        initialModel,
        enhancer
    );

    function executeEffects(callback: (msg: Msg) => void, effects: Array<Cmd<Msg>>): Array<Promise<any>> {
        return effects.map((effect) =>
            effect.execute()
                .then(callback)
        );
    }

    function enhancedDispatch(msg: Msg): Promise<any> {
        store.dispatch(msg);

        const currentQueue = queue;
        queue = [];

        return Promise.all(
            executeEffects(enhancedDispatch, currentQueue)
        );
    }

    executeEffects(enhancedDispatch, initialCmds);

    return {
        getState: store.getState,
        subscribe: store.subscribe,
        dispatch: enhancedDispatch,
        replaceReducer: compose(store.replaceReducer, liftReducer)
    };
}

export class Cmd<T> {
    public static of<T>(promiseCall: () => Promise<T>): Cmd<T> {
        return new Cmd(promiseCall);
    }

    constructor(private readonly promiseCall: () => Promise<T>) {}

    public map<R>(f: (a: T) => R): Cmd<R> {
        return Cmd.of(() => this.execute().then(f));
    }

    public execute(): Promise<T> {
        return this.promiseCall();
    }
}
