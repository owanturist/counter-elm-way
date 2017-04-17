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
    Cmd<Msg>
];

export type Update<Model> = <Msg extends Action>(msg: Msg, model: Model) => Loop<Model, Msg>;

export interface Store<Model> {
    dispatch: Dispatch<Model>;
    getState(): Model;
    subscribe(listener: () => void): Unsubscribe;
    replaceReducer(nextReducer: Update<Model>): void;
}

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

export abstract class Cmd<T> {
    public static of<T>(promise: Promise<T>): CmdSingle<T> {
        return new CmdSingle(promise);
    }

    public static butch<T>(cmds: Array<Cmd<T>>): CmdBatch<T> {
        return new CmdBatch(cmds);
    }

    public static none<T>(): CmdNone<T> {
        return new CmdNone();
    }

    public abstract map<R>(f: (a: T) => R): Cmd<R>;

    public abstract execute<R>(f: (a: T) => R): Promise<R>;

    public abstract concat(cmd: Cmd<T>): Cmd<T>;
}

class CmdSingle<T> implements Cmd<T> {
    constructor(private readonly promise: Promise<T>) {}

    public map<R>(f: (a: T) => R): Cmd<R> {
        return Cmd.of(this.execute(f));
    }

    public concat(cmd: Cmd<T>): CmdBatch<T> {
        return Cmd.butch([ this, cmd ]);
    }

    public execute<R>(f: (a: T) => R): Promise<R> {
        return this.promise.then(f);
    }
}

class CmdNone<T> implements Cmd<T> {
    public map(): CmdNone<T> {
        return this;
    }

    public concat(cmd: Cmd<T>): Cmd<T> {
        return cmd;
    }

    public execute(): Promise<any> {
        return Promise.resolve();
    }
}

class CmdBatch<T> implements Cmd<T> {
    constructor(private readonly cmds: Array<Cmd<T>>) {}

    public map<R>(f: (a: T) => R): CmdBatch<R> {
        return new CmdBatch(
            this.cmds.map((cmd) => cmd.map(f))
        );
    }

    public concat(cmd: Cmd<T>): CmdBatch<T> {
        return new CmdBatch([ ...this.cmds, cmd ]);
    }

    public execute<R>(f: (a: T) => R): Promise<R[]> {
        return Promise.all(
            this.cmds.map((cmd) => cmd.execute(f))
        );
    }
}
