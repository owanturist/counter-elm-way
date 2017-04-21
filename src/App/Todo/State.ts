import {
    Cmd
} from 'Platform/Cmd';
import * as Counter from 'App/Counter/State';
import {
    Msg,
    Model,
    Todo,
    CounterMsg
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
            const todo: Todo = Todo(
                model.nextId,
                model.input,
                Counter.initialModel
            );

            return [
                Model(
                    model.nextId + 1,
                    '',
                    [ ...model.todos, todo ]
                ),
                Counter.initialCmd.map(CounterMsg(todo.id))
            ];
        }

        case 'COUNTER_MSG': {
            type next = {
                todos: Todo[],
                cmd: Cmd<Msg>
            };
            const next: next = {
                todos: [],
                cmd: Cmd.none()
            };

            const { todos, cmd }: next = model.todos.reduce(
                (acc: next, todo: Todo) => {
                    if (todo.id !== msg.payload.id) {
                        return {
                            ...acc,
                            todos: [ ...acc.todos, todo ]
                        };
                    }

                    const [
                        nextCounterModel,
                        counterCmd
                    ] = Counter.update(msg.payload.msg, todo.counter);

                    const nextTodoModel = {
                        ...todo,
                        counter: nextCounterModel
                    };

                    return {
                        todos: [ ...acc.todos, nextTodoModel ],
                        cmd: counterCmd.map(CounterMsg(todo.id))
                    };
                },
                next
            );

            return [ { ...model, todos }, cmd ];
        }
    }
};
