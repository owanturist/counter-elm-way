import {
    Dispatch,
    Unsubscribe
} from 'redux';

import {
    Cmd
} from 'Platform/Cmd';

export type Loop<Model, Msg> = [ Model, Cmd<Msg> ];

export type Update<Model> = <Msg>(msg: Msg, model: Model) => Loop<Model, Msg>;

export interface Store<Model> {
    dispatch: Dispatch<Model>;
    getState(): Model;
    subscribe(listener: () => void): Unsubscribe;
    replaceReducer(nextReducer: Update<Model>): void;
}
