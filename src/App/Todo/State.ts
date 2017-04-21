import {
    Cmd
} from 'Platform/Cmd';
import * as Counter from 'App/Counter/State';
import {
    Msg,
    Model,
    Todo,
    CounterMsg,
    TodosMsg
} from './Types';

export const initialModel: Model = Model(0, 'All', '', []);

export const initialCmd: Cmd<Msg> = Cmd.none();

export const update = (msg: Msg, model: Model): [ Model, Cmd<Msg> ] => {
    switch (msg.type) {
        case 'CHANGE_FILTER': {
            return [
                { ...model, filter: msg.payload },
                Cmd.none()
            ];
        }

        case 'CHANGE_INPUT': {
            return [
                { ...model, input: msg.payload },
                Cmd.none()
            ];
        }

        case 'CREATE_TODO': {
            const todo: Todo = Todo(
                model.nextId,
                model.input,
                false,
                Counter.initialModel,
                initialModel
            );

            return [
                Model(
                    model.nextId + 1,
                    model.filter,
                    '',
                    [ todo, ...model.todos ]
                ),
                Cmd.butch<Msg>([
                    Counter.initialCmd.map(CounterMsg(todo.id)),
                    initialCmd.map(TodosMsg(todo.id))
                ])
            ];
        }

        case 'COMPLETE_TODO': {
            const nextTodos: Todo[] = model.todos.map((todo) => {
                if (todo.id !== msg.payload.id) {
                    return todo;
                }

                return {
                    ...todo,
                    completed: msg.payload.completed
                };
            });

            return [
                { ...model, todos: nextTodos },
                Cmd.none()
            ];
        }

        case 'DELETE_TODO': {
            const nextTodos: Todo[] = model.todos.filter(
                (todo) => todo.id !== msg.payload
            );

            return [
                { ...model, todos: nextTodos },
                Cmd.none()
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

                    const nextTodoModel: Todo = {
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

            return [
                { ...model, todos },
                cmd
            ];
        }

        case 'TODOS_MSG': {
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
                        nextTodosModel,
                        todosCmd
                    ] = update(msg.payload.msg, todo.todos);

                    const nextTodoModel: Todo = {
                        ...todo,
                        todos: nextTodosModel
                    };

                    return {
                        todos: [ ...acc.todos, nextTodoModel ],
                        cmd: todosCmd.map(TodosMsg(todo.id))
                    };
                },
                next
            );

            return [
                { ...model, todos },
                cmd
            ];
        }
    }
};
