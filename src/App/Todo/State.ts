import {
    Cmd
} from 'Platform/Cmd';
import {
    Msg,
    Model,
    Todo
} from './Types';

export const initialModel: Model = Model(0, '', []);

export const initialCmd: Cmd<Msg> = Cmd.none();

export const update = (msg: Msg, model: Model): [ Model, Cmd<Msg> ] => {
    switch (msg.type) {
        case 'CHANGE_INPUT': {
            return [
                {
                    ...model,
                    input: msg.payload
                },
                Cmd.none()
            ];
        }

        case 'CREATE_TODO': {
            return [
                Model(
                    model.nextId + 1,
                    '',
                    [ ...model.todos, Todo(model.nextId, model.input) ]
                ),
                Cmd.none()
            ];
        }
    }
};
