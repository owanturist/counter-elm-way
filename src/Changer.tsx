import React from 'react';

import {
    Maybe,
    Nothing,
    Just
} from 'Fractal/Maybe';
import {
    Dispatch
} from 'Fractal/Platform';

import {
    Currency
} from './Currency';

const stringToAmount = (input: string): Maybe<number> => {
    if (input.trim() === '') {
        return Nothing;
    }

    const amount = Number(
        input.trim().replace(/(-?\d*(,|\.)?\d{0,2})(.*)/, '$1')
    );

    if (isNaN(amount)) {
        return Nothing;
    }

    return Just(amount);
};

export interface Model {
    currency: string;
}

export const init = (currency: string): Model => ({
    currency
});

export type Msg
    = { $: 'CHANGE_CURRENCY'; _0: string }
    | { $: 'CHANGE_AMOUNT'; _0: Maybe<number> }
    ;

export type Stage
    = { $: 'UPDATED'; _0: Model }
    | { $: 'AMOUNT_CHANGED'; _0: Maybe<number> }
    ;

export const update = (msg: Msg, model: Model): Stage => {
    switch (msg.$) {
        case 'CHANGE_CURRENCY': {
            return {
                $: 'UPDATED',
                _0: { ...model, currency: msg._0 }
            };
        }

        case 'CHANGE_AMOUNT': {
            return {
                $: 'AMOUNT_CHANGED',
                _0: msg._0
            };
        }
    }
};

export const View = ({ dispatch, model, amount, rates }: {
    dispatch: Dispatch<Msg>;
    model: Model;
    amount: string;
    rates: Array<Currency>;
}): JSX.Element => (
    <div>
        {Maybe.fromNullable(rates.find((currency: Currency) => currency.code === model.currency)).cata({
            Nothing: () => null,
            Just: (currency: Currency) => (
                <div>
                    <h4>{currency.code}</h4>
                    <p>You have {currency.symbol}{currency.amount}</p>

                    <input
                        type="number"
                        min={-currency.amount}
                        value={amount}
                        onChange={event => dispatch({
                            $: 'CHANGE_AMOUNT',
                            _0: stringToAmount(event.currentTarget.value)
                        })}
                    />
                </div>
            )
        })}

        <ul>
            {rates.map((currency: Currency) => (
                <li key={currency.code}>
                    <button
                        disabled={currency.code === model.currency}
                        onClick={() => dispatch({
                            $: 'CHANGE_CURRENCY',
                            _0: currency.code
                        })}
                    >Choose {currency.code}</button>
                </li>
            ))}
        </ul>
    </div>
);
