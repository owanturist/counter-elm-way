import React from 'react';

import { Cmd, Sub } from 'frctl';

import * as Counter from './Counter';
import * as Todo from './Todo';
import * as Swapi from './Swapi';

export interface Model {
    swapi: Swapi.Model;
    firstCounter: Counter.Model;
    secondCounter: Counter.Model;
    todo: Todo.Model;
}

export const init = (): [ Model, Cmd<Msg> ] => {
    const initialCounterModel = Counter.init(0);
    const [ initialSwapiModel, initialSwapiCmd ] = Swapi.init('1');
    const initialTodoModel = Todo.init;

    return [
        {
            swapi: initialSwapiModel,
            firstCounter: initialCounterModel,
            secondCounter: initialCounterModel,
            todo: initialTodoModel
        },
        initialSwapiCmd.map(swapiMsg => new SwapMsg(swapiMsg))
    ];
};

export interface Msg {
    update(model: Model): [ Model, Cmd<Msg> ];
}

class SwapMsg implements Msg {
    public constructor(private readonly swapiMsg: Swapi.Msg) {}

    public update(model: Model): [ Model, Cmd<Msg> ] {
        const [ nextSwapiModel, swapiCmd ] = this.swapiMsg.update(model.swapi);

        return [
            {
                ...model,
                swapi: nextSwapiModel
            },
            swapiCmd.map(swapiMsg => new SwapMsg(swapiMsg))
        ];
    }
}

class FirstCounterMsg implements Msg {
    public constructor(private readonly counterMsg: Counter.Msg) {}

    public update(model: Model): [ Model, Cmd<Msg> ] {
        const [ nextFirstCounter, counterCmd ] = this.counterMsg.update(model.firstCounter);

        return [
            {
                ...model,
                firstCounter: nextFirstCounter
            },
            counterCmd.map(counterMsg => new FirstCounterMsg(counterMsg))
        ];
    }
}

class SecondCounterMsg implements Msg {
    public constructor(private readonly counterMsg: Counter.Msg) {}

    public update(model: Model): [ Model, Cmd<Msg> ] {
        const [ nextSecondCounter, counterCmd ] = this.counterMsg.update(model.secondCounter);

        return [
            {
                ...model,
                secondCounter: nextSecondCounter
            },
            counterCmd.map(counterMsg => new SecondCounterMsg(counterMsg))
        ];
    }
}

class TodoMsg implements Msg {
    public constructor(private readonly todoMsg: Todo.Msg) {}

    public update(model: Model): [ Model, Cmd<Msg> ] {
        const [ nextTodo, todoListCmd ] = this.todoMsg.update(model.todo);

        return [
            {
                ...model,
                todo: nextTodo
            },
            todoListCmd.map(todoMsg => new TodoMsg(todoMsg))
        ];
    }
}

export const subscriptions = (model: Model): Sub<Msg> => Sub.batch<Msg>([
    Counter.subscription(model.firstCounter).map(firstCounterMsg => new FirstCounterMsg(firstCounterMsg)),
    Counter.subscription(model.secondCounter).map(secondCounterMsg => new SecondCounterMsg(secondCounterMsg)),
    Todo.subscriptions(model.todo).map(todoMsg => new TodoMsg(todoMsg))
]);

export const View: React.StatelessComponent<{
    model: Model;
    dispatch(msg: Msg): void;
}> = ({ dispatch, model }) => (
    <div>
        <Swapi.View
            model={model.swapi}
            dispatch={swapiMsg => dispatch(new SwapMsg(swapiMsg))}
        />
        <Counter.View
            model={model.firstCounter}
            dispatch={firstCounterMsg => dispatch(new FirstCounterMsg(firstCounterMsg))}
        />
        <Counter.View
            model={model.secondCounter}
            dispatch={secondCounterMsg => dispatch(new SecondCounterMsg(secondCounterMsg))}
        />
        <Todo.View
            initialCount={0}
            model={model.todo}
            dispatch={todoMsg => dispatch(new TodoMsg(todoMsg))}
        />
    </div>
);
