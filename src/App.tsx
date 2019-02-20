import React from 'react';

import {
    Cmd
} from 'frctl/src/Platform/Cmd';
import {
    Sub
} from 'frctl/src/Platform/Sub';

import * as Counter from './Counter';
import * as Todo from './Todo';
import * as Swapi from './Swapi';

export type Msg
    = { $: 'SWAPI_MSG'; _0: Swapi.Msg }
    | { $: 'FIRST_COUNTER_MSG'; _0: Counter.Msg }
    | { $: 'SECOND_COUNTER_MSG'; _0: Counter.Msg }
    | { $: 'TODO_MSG'; _0: Todo.Msg }
    ;

interface Model {
    swapi: Swapi.Model;
    firstCounter: Counter.Model;
    secondCounter: Counter.Model;
    todo: Todo.Model;
}

export const init = (): [ Model, Cmd<Msg> ] => {
    const [ initialCounterModel, initialCounterCmd ] = Counter.init(0);
    const [ initialSwapiModel, initialSwapiCmd ] = Swapi.init('1');
    const [ initialTodoModel, initialTodoCmd ] = Todo.initial;

    return [
        {
            swapi: initialSwapiModel,
            firstCounter: initialCounterModel,
            secondCounter: initialCounterModel,
            todo: initialTodoModel
        },
        Cmd.batch([
            initialSwapiCmd.map((swapiMsg: Swapi.Msg): Msg => ({ $: 'SWAPI_MSG', _0: swapiMsg })),
            initialCounterCmd.map((counterMsg: Counter.Msg): Msg => ({ $: 'FIRST_COUNTER_MSG', _0: counterMsg })),
            initialCounterCmd.map((counterMsg: Counter.Msg): Msg => ({ $: 'SECOND_COUNTER_MSG', _0: counterMsg })),
            initialTodoCmd.map((todoMsg: Todo.Msg): Msg => ({ $: 'TODO_MSG', _0: todoMsg }))
        ])
    ];
};

export const update = (msg: Msg, model: Model): [ Model, Cmd<Msg>]  => {
    switch (msg.$) {
        case 'SWAPI_MSG': {
            const [ nextSwapiModel, swapiCmd ] = Swapi.update(msg._0, model.swapi);

            return [
                {
                    ...model,
                    swapi: nextSwapiModel
                },
                swapiCmd.map((swapiMsg: Swapi.Msg): Msg => ({ $: 'SWAPI_MSG', _0: swapiMsg }))
            ];
        }

        case 'FIRST_COUNTER_MSG': {
            const [
                nextFirstCounter,
                counterCmd
            ] = Counter.update(msg._0, model.firstCounter);

            return [
                {
                    ...model,
                    firstCounter: nextFirstCounter
                },
                counterCmd.map((counterMsg: Counter.Msg): Msg => ({ $: 'FIRST_COUNTER_MSG', _0: counterMsg }))
            ];
        }

        case 'SECOND_COUNTER_MSG': {
            const [
                nextSecondCounter,
                counterCmd
            ] = Counter.update(msg._0, model.secondCounter);

            return [
                {
                    ...model,
                    secondCounter: nextSecondCounter
                },
                counterCmd.map((counterMsg: Counter.Msg): Msg => ({ $: 'SECOND_COUNTER_MSG', _0: counterMsg }))
            ];
        }

        case 'TODO_MSG': {
            const [
                nextTodo,
                todoListCmd
            ] = Todo.update(msg._0, model.todo);

            return [
                {
                    ...model,
                    todo: nextTodo
                },
                todoListCmd.map((todoMsg: Todo.Msg): Msg => ({ $: 'TODO_MSG', _0: todoMsg }))
            ];
        }
    }
};

export const subscriptions = (model: Model): Sub<Msg> => Sub.batch([
    Todo.subscriptions(model.todo).map((msg: Todo.Msg): Msg => ({ $: 'TODO_MSG', _0: msg })),
    Counter.subscription(model.firstCounter).map((msg: Counter.Msg): Msg => ({ $: 'FIRST_COUNTER_MSG', _0: msg })),
    Counter.subscription(model.secondCounter).map((msg: Counter.Msg): Msg => ({ $: 'SECOND_COUNTER_MSG', _0: msg }))
]);

export const View = ({ dispatch, model }: {
    model: Model;
    dispatch(msg: Msg): void;
}): JSX.Element => (
    <div>
        <Swapi.View
            model={model.swapi}
            dispatch={(swapiMsg: Swapi.Msg) => dispatch({ $: 'SWAPI_MSG', _0: swapiMsg })}
        />
        <Counter.View
            model={model.firstCounter}
            dispatch={(firstCounterMsg: Counter.Msg) => dispatch({ $: 'FIRST_COUNTER_MSG', _0: firstCounterMsg })}
        />
        <Counter.View
            model={model.secondCounter}
            dispatch={(secondCounterMsg: Counter.Msg) => dispatch({ $: 'SECOND_COUNTER_MSG', _0: secondCounterMsg })}
        />
        <Todo.View
            initialCount={0}
            model={model.todo}
            dispatch={(todoMsg: Todo.Msg) => dispatch({ $: 'TODO_MSG', _0: todoMsg })}
        />
    </div>
);
