import {
    Cmd
} from 'Platform/Cmd';
import {
    initialModel as CounterInitialModel,
    initialCmd as CounterInitialCmd,
    update as CounterUpdate
} from 'App/Counter/State';
import {
    Msg,
    Model,
    Todo,
    Counter
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
                CounterInitialModel
            );

            return [
                Model(
                    model.nextId + 1,
                    '',
                    [ ...model.todos, todo ]
                ),
                CounterInitialCmd.map(Counter(todo.id))
            ];
        }

        case 'COUNTER': {
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
                    ] = CounterUpdate(msg.payload.counterMsg, todo.counter);

                    const nextTodoModel = {
                        ...todo,
                        counter: nextCounterModel
                    };

                    return {
                        todos: [ ...acc.todos, nextTodoModel ],
                        cmd: counterCmd.map(Counter(todo.id))
                    };
                },
                next
            );

            return [ { ...model, todos }, cmd ];
        }
    }
};
