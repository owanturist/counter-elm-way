import React from 'react';
import {
    render
} from 'react-dom';

import { Cmd, Sub } from 'frctl';
import { Url } from 'frctl/Url';
import { cons } from 'frctl/Basics';

import { UrlRequest, ReactProvider, Navigation } from './ReactProvider';
import * as Counter from './Counter';
import * as Todo from './Todo';
import * as Swapi from './Swapi';

interface Model {
    navigation: Navigation;
    location: string;
    swapi: Swapi.Model;
    firstCounter: Counter.Model;
    secondCounter: Counter.Model;
    todo: Todo.Model;
}

const urlToLocation = (url: Url): string => url.toString();

const init = (_flags: never, url: Url, key: Navigation): [ Model, Cmd<Msg> ] => {
    const initialCounterModel = Counter.init(0);
    const [ initialSwapiModel, initialSwapiCmd ] = Swapi.init('1');
    const initialTodoModel = Todo.init;

    return [
        {
            navigation: key,
            location: urlToLocation(url),
            swapi: initialSwapiModel,
            firstCounter: initialCounterModel,
            secondCounter: initialCounterModel,
            todo: initialTodoModel
        },
        initialSwapiCmd.map(swapiMsg => new SwapMsg(swapiMsg))
    ];
};

interface Msg {
    update(model: Model): [ Model, Cmd<Msg> ];
}

const RequestUrl = cons<[ UrlRequest ], Msg>(class RequestUrl implements Msg {
    public constructor(private readonly request: UrlRequest) {}

    public update(model: Model): [ Model, Cmd<Msg> ] {
        return [
            model,
            this.request.cata({
                Internal: url => model.navigation.pushUrl(url.toString()),

                External: () => Cmd.none
            })
        ];
    }
});

const ChangeUrl = cons<[ Url ], Msg>(class ChangeUrl implements Msg {
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

const subscriptions = (model: Model): Sub<Msg> => Sub.batch<Msg>([
    Counter.subscription(model.firstCounter).map(firstCounterMsg => new FirstCounterMsg(firstCounterMsg)),
    Counter.subscription(model.secondCounter).map(secondCounterMsg => new SecondCounterMsg(secondCounterMsg)),
    Todo.subscriptions(model.todo).map(todoMsg => new TodoMsg(todoMsg))
]);

const View: React.StatelessComponent<{
    model: Model;
    dispatch(msg: Msg): void;
}> = ({ dispatch, model }) => (
    <div>
        {model.location}

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

// M A I N


const update = (msg: Msg, model: Model): [ Model, Cmd<Msg> ] => msg.update(model);

render(
    <ReactProvider
        flags={{}}
        init={init}
        onUrlChange={ChangeUrl}
        onUrlRequest={RequestUrl}
        update={update}
        subscriptions={subscriptions}
        view={View}
    />,
    document.getElementById('app')
);
