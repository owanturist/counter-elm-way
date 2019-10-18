import React from 'react';

import {
    Cmd
} from 'frctl/Platform/Cmd';
import {
    Sub
} from 'frctl/Platform/Sub';

import * as Counter from './Counter';
import * as Swapi from './Swapi';

type Filter
    = 'ALL'
    | 'COMPLETED'
    | 'UNCOMPLETED'
    ;

interface Todo {
    id: number;
    message: string;
    completed: boolean;
    counter: Counter.Model;
    swapi: Swapi.Model;
    todos: Model;
}

export interface Model {
    nextId: number;
    filter: Filter;
    input: string;
    todos: Array<Todo>;
}

export const init: Model = {
    nextId: 0,
    filter: 'ALL',
    input: '',
    todos: []
};

export interface Msg {
    update(model: Model): [ Model, Cmd<Msg> ];
}

class ChangeFilter implements Msg {
    public constructor(private readonly filter: Filter) {}

    public update(model: Model): [ Model, Cmd<Msg> ] {
        return [
            { ...model, filter: this.filter },
            Cmd.none
        ];
    }
}

class ChangeInput implements Msg {
    public constructor(private readonly input: string) {}

    public update(model: Model): [ Model, Cmd<Msg> ] {
        return [
            { ...model, input: this.input },
            Cmd.none
        ];
    }
}

class CreateTodo implements Msg {
    public constructor(private readonly initialCount: number) {}

    public update(model: Model): [ Model, Cmd<Msg> ] {
        const initialCounterModel = Counter.init(this.initialCount);
        const [
            initialSwapiModel,
            initialSwapiCmd
        ] = Swapi.init(initialCounterModel.count.toString());

        const newTodo: Todo = {
            id: model.nextId,
            message: model.input,
            completed: false,
            counter: initialCounterModel,
            swapi: initialSwapiModel,
            todos: init
        };

        return [
            {
                ...model,
                nextId: model.nextId + 1,
                input: '',
                todos: [ newTodo, ...model.todos ]
            },
            initialSwapiCmd.map(swapiMsg => new SwapiMsg(newTodo.id, swapiMsg))
        ];
    }
}

class CompleteTodo implements Msg {
    public constructor(
        private readonly todoID: number,
        private readonly completed: boolean
    ) {}

    public update(model: Model): [ Model, Cmd<Msg> ] {
        const nextTodos: Array<Todo> = model.todos.map(todo => {
            if (todo.id !== this.todoID) {
                return todo;
            }

            return {
                ...todo,
                completed: this.completed
            };
        });

        return [
            { ...model, todos: nextTodos },
            Cmd.none
        ];
    }
}

class DeleteTodo implements Msg {
    public constructor(private readonly todoID: number) {}

    public update(model: Model): [ Model, Cmd<Msg> ] {
        const nextTodos: Array<Todo> = model.todos.filter(
            todo => todo.id !== this.todoID
        );

        return [
            { ...model, todos: nextTodos },
            Cmd.none
        ];
    }
}

class CounterMsg implements Msg {
    public constructor(
        private readonly todoID: number,
        private readonly counterMsg: Counter.Msg
    ) {}

    public update(model: Model): [ Model, Cmd<Msg> ] {
        interface Acc {
            todos: Array<Todo>;
            cmd: Cmd<Msg>;
        }

        const { todos, cmd }: Acc = model.todos.reduce(
            (acc: Acc, todo: Todo) => {
                if (todo.id !== this.todoID) {
                    return {
                        ...acc,
                        todos: [ ...acc.todos, todo ]
                    };
                }

                const [
                    nextCounterModel,
                    counterCmd
                ] = this.counterMsg.update(todo.counter);

                const [
                    nextSwapiModel,
                    swapiCmd
                ]: [ Swapi.Model, Cmd<Swapi.Msg> ] = nextCounterModel.auto
                    || nextCounterModel.count === todo.counter.count
                    ? [ todo.swapi, Cmd.none ]
                    : Swapi.init(nextCounterModel.count.toString())
                    ;

                const nextTodoModel: Todo = {
                    ...todo,
                    counter: nextCounterModel,
                    swapi: nextSwapiModel
                };

                return {
                    todos: [ ...acc.todos, nextTodoModel ],
                    cmd: Cmd.batch<Msg>([
                        counterCmd.map(counterMsg => new CounterMsg(todo.id, counterMsg)),
                        swapiCmd.map(swapiMsg => new SwapiMsg(todo.id, swapiMsg))
                    ])
                };
            },
            {
                todos: [],
                cmd: Cmd.none
            }
        );

        return [
            { ...model, todos },
            cmd
        ];
    }
}

class SwapiMsg implements Msg {
    public constructor(
        private readonly todoID: number,
        private readonly swapiMsg: Swapi.Msg
    ) {}

    public update(model: Model): [ Model, Cmd<Msg> ] {
        interface Acc {
            todos: Array<Todo>;
            cmd: Cmd<Msg>;
        }

        const { todos, cmd }: Acc = model.todos.reduce(
            (acc: Acc, todo: Todo) => {
                if (todo.id !== this.todoID) {
                    return {
                        ...acc,
                        todos: [ ...acc.todos, todo ]
                    };
                }

                const [ nextSwapiModel, swapiCmd ] = this.swapiMsg.update(todo.swapi);

                const nextTodoModel: Todo = {
                    ...todo,
                    swapi: nextSwapiModel
                };

                return {
                    todos: [ ...acc.todos, nextTodoModel ],
                    cmd: swapiCmd.map(swapiMsg => new SwapiMsg(todo.id, swapiMsg))
                };
            },
            {
                todos: [],
                cmd: Cmd.none
            }
        );

        return [
            { ...model, todos },
            cmd
        ];
    }
}

class TodoMsg implements Msg {
    public constructor(
        private readonly todoID: number,
        private readonly todoMsg: Msg
    ) {}

    public update(model: Model): [ Model, Cmd<Msg> ] {
        interface Acc {
            todos: Array<Todo>;
            cmd: Cmd<Msg>;
        }

        const { todos, cmd }: Acc = model.todos.reduce(
            (acc: Acc, todo: Todo) => {
                if (todo.id !== this.todoID) {
                    return {
                        ...acc,
                        todos: [ ...acc.todos, todo ]
                    };
                }

                const [ nextTodosModel, todoCmd ] = this.todoMsg.update(todo.todos);

                const nextTodoModel: Todo = {
                    ...todo,
                    todos: nextTodosModel
                };

                return {
                    todos: [ ...acc.todos, nextTodoModel ],
                    cmd: todoCmd.map(todoMsg => new TodoMsg(todo.id, todoMsg))
                };
            },
            {
                todos: [],
                cmd: Cmd.none
            }
        );

        return [
            { ...model, todos },
            cmd
        ];
    }
}

const filtersList: Array<Filter> = [ 'ALL', 'COMPLETED', 'UNCOMPLETED' ];

const filterTodos = (filter: Filter) => (todo: Todo): boolean => {
    switch (filter) {
        case 'ALL': {
            return true;
        }

        case 'COMPLETED': {
            return todo.completed;
        }

        case 'UNCOMPLETED': {
            return !todo.completed;
        }
    }
};

const FilterView: React.StatelessComponent<{
    filters: Array<Filter>;
    current: Filter;
    dispatch(msg: Msg): void;
}> = ({ dispatch, filters, current }) => (
    <div>
        {filters.map(filter => (
            <label key={filter}>
                <input
                    type="radio"
                    checked={filter === current}
                    onChange={() => dispatch(new ChangeFilter(filter))}
                />
                {filter}
            </label>
        ))}
    </div>
);

const TodoView: React.StatelessComponent<{
    todo: Todo;
    dispatch(msg: Msg): void;
}> = ({ dispatch, todo }) => (
    <li>
        <input
            type="checkbox"
            checked={todo.completed}
            onChange={event => dispatch(new CompleteTodo(todo.id, event.target.checked))}
        />

        <Counter.View
            disabled={todo.swapi.person.isLoading()}
            model={todo.counter}
            dispatch={counterMsg => dispatch(new CounterMsg(todo.id, counterMsg))}
        />

        <Swapi.View
            model={todo.swapi}
            dispatch={swapiMsg => dispatch(new SwapiMsg(todo.id, swapiMsg))}
        />

        {todo.message}

        <button
            onClick={() => dispatch(new DeleteTodo(todo.id))}
        >
            &times;
        </button>

        <View
            initialCount={todo.counter.count}
            model={todo.todos}
            dispatch={todoMsg => dispatch(new TodoMsg(todo.id, todoMsg))}
        />
    </li>
);

const subscriptionsTodo = (todo: Todo): Sub<Msg> => Sub.batch<Msg>([
    Counter.subscription(todo.counter).map(counterMsg => new CounterMsg(todo.id, counterMsg)),
    subscriptions(todo.todos).map(todoMsg => new TodoMsg(todo.id, todoMsg))
]);

export const subscriptions = (model: Model): Sub<Msg> => Sub.batch(
    model.todos.map(subscriptionsTodo)
);

export const View: React.StatelessComponent<{
    model: Model;
    initialCount: number;
    dispatch(msg: Msg): void;
}> = ({ dispatch, model, ...props }) => (
    <div>
        <div>Todo List:</div>

        <form
            action="todo"
            onSubmit={event => {
                dispatch(new CreateTodo(props.initialCount));

                event.preventDefault();
            }}
        >
            <FilterView
                filters={filtersList}
                current={model.filter}
                dispatch={dispatch}
            />

            <input
                type="text"
                value={model.input}
                onChange={event => dispatch(new ChangeInput(event.target.value))}
            />
            <button type="submit">
                Create
            </button>
        </form>

        <ul>
            {model.todos.filter(filterTodos(model.filter)).map((todo: Todo) => (
                <TodoView
                    key={todo.id}
                    todo={todo}
                    dispatch={dispatch}
                />
            ))}
        </ul>
    </div>
);
