import React from 'react';

import { Cmd, Sub } from 'frctl';
import { Url } from 'frctl/Url';
import { cons } from 'frctl/Basics';
import { UrlRequest, Key, Link } from './ReactProvider';

import * as Counter from './Counter';
import * as Todo from './Todo';
import * as Swapi from './Swapi';

export interface Model {
    key: Key;
    location: string;
    swapi: Swapi.Model;
    firstCounter: Counter.Model;
    secondCounter: Counter.Model;
    todo: Todo.Model;
}

const urlToLocation = (url: Url): string => url.toString();

export const init = (_flags: any, url: Url, key: Key): [ Model, Cmd<Msg> ] => {
    const initialCounterModel = Counter.init(0);
    const [ initialSwapiModel, initialSwapiCmd ] = Swapi.init('1');
    const initialTodoModel = Todo.init;

    return [
        {
            key,
            location: urlToLocation(url),
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

export const onUrlRequest = cons<[ UrlRequest ], Msg>(class RequestUrl implements Msg {
    public constructor(private readonly request: UrlRequest) {}

    public update(model: Model): [ Model, Cmd<Msg> ] {
        return [
            model,
            this.request.cata({
                Internal: url => model.key.push(url.toString()),

                External: () => Cmd.none
            })
        ];
    }
});

export const onUrlChange = cons<[ Url ], Msg>(class ChangeUrl implements Msg {
    public constructor(private readonly url: Url) {}

    public update(model: Model): [ Model, Cmd<Msg> ] {
        return [
            {
                ...model,
                location: urlToLocation(this.url)
            },
            Cmd.none
        ];
    }
});

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
        {model.location}

        <br />

        <Link href="/test1">Go 1</Link>

        <br />

        <Link href="/test2">Go 2</Link>

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
