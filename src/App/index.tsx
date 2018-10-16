import React from 'react';

import {
    Dispatch
} from 'Platform';
import {
    Cmd
} from 'Platform/Cmd';

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

export const View = ({ dispatch, model }: {
    dispatch: Dispatch<Msg>;
    model: Model;
}): JSX.Element => (
    <div>
        <Swapi.View
            model={model.swapi}
            dispatch={msg => dispatch({ $: 'SWAPI_MSG', _0: msg })}
        />
        <Counter.View
            model={model.firstCounter}
            dispatch={msg => dispatch({ $: 'FIRST_COUNTER_MSG', _0: msg })}
        />
        <Counter.View
            model={model.secondCounter}
            dispatch={msg => dispatch({ $: 'SECOND_COUNTER_MSG', _0: msg })}
        />
        <Todo.View
            initialCount={0}
            model={model.todo}
            dispatch={msg => dispatch({ $: 'TODO_MSG', _0: msg })}
        />
    </div>
);
