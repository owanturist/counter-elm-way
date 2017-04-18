import {
    Cmd
} from 'Platform/Cmd';
import {
    Msg,
    Model
} from 'App/Types';
import {
    update
} from 'App/State';
import {
    Store
} from './Types';
import {
    createLoopStore
} from './Loop';

export const create = (initial: [ Model, Cmd<Msg> ]): Store<Model> =>
    createLoopStore(update, initial);
