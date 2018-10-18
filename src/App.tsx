import React from 'react';

import {
    Either
} from 'Fractal/Either';
import {
    RemoteData,
    Loading
} from 'Fractal/RemoteData';
import {
    Dispatch
} from 'Fractal/Platform';
import {
    Cmd
} from 'Fractal/Platform/Cmd';
import {
    Sub
} from 'Fractal/Platform/Sub';
import * as Http from 'Fractal/Http';

import {
    Currency
} from './Currency';
import * as Api from './Api';

export type Msg
    = { $: 'FETCH_RATES' }
    | { $: 'FETCH_RATES_DONE'; _0: Either<Http.Error, Api.Response<Array<Currency>>> }
    ;

interface Model {
    rates: RemoteData<Http.Error, Api.Response<Array<Currency>>>;
}

const fetchRates: Cmd<Msg> = Api.getRatesFor([ 'GBP', 'EUR', 'USD' ])
    .send((result): Msg => ({ $: 'FETCH_RATES_DONE', _0: result }));

export const init = (): [ Model, Cmd<Msg> ] => [
    {
        rates: Loading()
    },
    fetchRates
];

export const update = (msg: Msg, model: Model): [ Model, Cmd<Msg> ] => {
    switch (msg.$) {
        case 'FETCH_RATES': {
            return [
                { ...model, rates: Loading() },
                fetchRates
            ];
        }

        case 'FETCH_RATES_DONE': {
            return [
                { ...model, rates: RemoteData.fromEither(msg._0) },
                Cmd.none()
            ];
        }
    }
};

export const subscriptions = (_model: Model): Sub<Msg> => {
    return Sub.none();
};

export const View = ({ dispatch, model }: {
    dispatch: Dispatch<Msg>;
    model: Model;
}): JSX.Element => model.rates.cata({
    NotAsked: () => (
        <h1>It's an impossible situation here</h1>
    ),

    Loading: () => (
        <h1>Loading...</h1>
    ),

    Failure: () => (
        <div>
            <h1>
                Wow-wow... something went wrong
            </h1>
            <button
                onClick={() => dispatch({ $: 'FETCH_RATES' })}
            >
                Try again
            </button>
        </div>
    ),

    Succeed: response => (
        <div>
            <h1>Success!</h1>

            <ul>
                {response.data.map(currency => (
                    <li key={currency.toCode()}>
                        Code: {currency.toCode()}
                    </li>
                ))}
            </ul>
        </div>
    )
});
