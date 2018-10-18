import React from 'react';

import {
    Maybe,
    Nothing,
    Just
} from 'Fractal/Maybe';
import {
    Either
} from 'Fractal/Either';
import {
    RemoteData,
    Loading,
    Failure,
    Succeed
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
    | { $: 'CHANGE_AMOUNT'; _0: string }
    | { $: 'CHANGE_CURRENT_CURRENCY'; _0: string; _1: number }
    ;

interface Model {
    rates: RemoteData<Http.Error, Api.Response<Array<Currency>>>;
    wallet: {[ currency: string ]: number };
    currentCurrencyCode: Maybe<string>;
    amount: number;
}

const roundAmount = (amount: number): number => Math.round(amount * 100) / 100;

const fetchRates: Cmd<Msg> = Api.getRatesFor([ 'EUR', 'GBP', 'USD' ])
    .send((result): Msg => ({ $: 'FETCH_RATES_DONE', _0: result }));

export const init = (): [ Model, Cmd<Msg> ] => [
    {
        rates: Loading(),
        wallet: {
            GBP: 58.33,
            EUR: 116.12,
            USD: 25.51
        },
        currentCurrencyCode: Nothing(),
        amount: 0
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
                msg._0.cata({
                    Left: (error: Http.Error) => ({
                        ...model,
                        rates: Failure(error)
                    }),

                    Right: (response: Api.Response<Array<Currency>>) => ({
                        ...model,
                        rates: Succeed(response),
                        currentCurrencyCode: Maybe.fromNullable(response.data[ 0 ]).map(currency => currency.code)
                    })
                }),
                Cmd.none()
            ];
        }

        case 'CHANGE_AMOUNT': {
            return [
                { ...model, amount: Number(msg._0) || 0 },
                Cmd.none()
            ];
        }

        case 'CHANGE_CURRENT_CURRENCY': {
            return [
                {
                    ...model,
                    currentCurrencyCode: Just(msg._0),
                    amount: msg._1
                },
                Cmd.none()
            ];
        }
    }
};

export const subscriptions = (_model: Model): Sub<Msg> => {
    return Sub.none();
};

const ViewChanger = ({ dispatch, currency, debit, amount }: {
    dispatch: Dispatch<Msg>;
    currency: Currency;
    debit: number;
    amount: number;
}): JSX.Element => (
    <div>
        <h4>{currency.code}</h4>
        <div>You have {currency.symbol}{debit}</div>

        <input
            type="number"
            value={Math.max(-debit, amount) || ''}
            min={-debit} // @TODO max?
            onChange={event => dispatch({ $: 'CHANGE_AMOUNT', _0: event.currentTarget.value })}
        />
    </div>
);

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

    Succeed: response => {
        const currentCurrency: Maybe<Currency> = response.data.reduce(
            (acc, currency) => model.currentCurrencyCode.cata({
                Nothing: () => acc,
                Just: code => code === currency.code ? Just(currency) : acc
            }),
            Nothing()
        );

        return (
            <div>
                <h1>Success!</h1>

                <ul>
                    {response.data.map(currency => {
                        const isCurrent = model.currentCurrencyCode.isEqual(Just(currency.code));
                        const relativeAmount = currentCurrency
                                .map(current => roundAmount(currency.convertTo(model.amount, current)))
                                .getOrElse(0);

                        return (
                            <li key={currency.code}>
                                <button
                                    disabled={isCurrent}
                                    onClick={() => dispatch({
                                        $: 'CHANGE_CURRENT_CURRENCY',
                                        _0: currency.code,
                                        _1: relativeAmount
                                    })}
                                >Choose</button>
                                <ViewChanger
                                    dispatch={dispatch}
                                    currency={currency}
                                    debit={model.wallet[ currency.code ] || 0}
                                    amount={relativeAmount}
                                />
                            </li>
                        );
                    })}
                </ul>
            </div>
        );
    }
});
