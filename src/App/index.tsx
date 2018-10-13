import React from 'react';

import {
    Dispatch
} from 'Platform';
import {
    Cmd
} from 'Platform/Cmd';

import * as Counter from './Counter';
import * as Todo from './Todo';

export type Msg
    = { $: 'FIRST_COUNTER_MSG', _0: Counter.Msg }
    | { $: 'SECOND_COUNTER_MSG', _0: Counter.Msg }
    | { $: 'TODO_MSG', _0: Todo.Msg }
    ;

interface Model {
    firstCounter: Counter.Model;
    secondCounter: Counter.Model;
    todo: Todo.Model;
}

export const initial: [ Model, Cmd<Msg> ] = [
    {
        firstCounter: Counter.initial[ 0 ],
        secondCounter: Counter.initial[ 0 ],
        todo: Todo.initial[ 0 ]
    },
    Cmd.batch([
        Counter.initial[ 1 ].map((counterMsg: Counter.Msg): Msg => ({ $: 'FIRST_COUNTER_MSG', _0: counterMsg })),
        Counter.initial[ 1 ].map((counterMsg: Counter.Msg): Msg => ({ $: 'SECOND_COUNTER_MSG', _0: counterMsg })),
        Todo.initial[ 1 ].map((todoMsg: Todo.Msg): Msg => ({ $: 'TODO_MSG', _0: todoMsg }))
    ])
];

export const update = (msg: Msg, model: Model): [ Model, Cmd<Msg>]  => {
    switch (msg.$) {
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
        <Counter.View
            model={model.firstCounter}
            dispatch={(msg) => dispatch({ $: 'FIRST_COUNTER_MSG', _0: msg })}
        />
        <Counter.View
            model={model.secondCounter}
            dispatch={(msg) => dispatch({ $: 'SECOND_COUNTER_MSG', _0: msg })}
        />
        <Todo.View
            model={model.todo}
            dispatch={(msg) => dispatch({ $: 'TODO_MSG', _0: msg })}
        />
    </div>
);
