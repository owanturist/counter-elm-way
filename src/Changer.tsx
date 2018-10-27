import * as React from 'react';
import styled from 'styled-components';

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
import * as Utils from './Utils';

/**
 * M O D E L
 */

export interface Model {
    currency: string;
}

export const isSame = (left: Model, right: Model): boolean => left.currency === right.currency;

export const init = (currency: string): Model => ({
    currency
});

/**
 * U P D A T E
 */

export type Msg
    = { $: 'CHANGE_CURRENCY'; _0: string }
    | { $: 'CHANGE_AMOUNT'; _0: Maybe<number> }
    ;

export type Stage
    = { $: 'UPDATED'; _0: boolean; _1: Model }
    | { $: 'AMOUNT_CHANGED'; _0: Maybe<number> }
    ;

export const update = (msg: Msg, model: Model): Stage => {
    switch (msg.$) {
        case 'CHANGE_CURRENCY': {
            return {
                $: 'UPDATED',
                _0: true,
                _1: {
                    ...model,
                    currency: msg._0
                }
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

/**
 * V I E W
 */

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

const Root = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 1em 2em;
    color: #fff;
`;

const Main = styled.label`
    display: flex;
    align-items: center;
    font-size: 2.4em;
    font-weight: 300;
    line-height: 1;
`;

const Info = styled.div`
    display: flex;
    justify-content: space-between;
    margin-top: 1em;
    font-size: .8em;
    font-weight: 300;
    opacity: .6;
`;

const Input = styled.input`
    width: 100%;
    padding: 0;
    border: none;
    background: transparent;
    font: inherit;
    color: inherit;
    outline: none;
    text-align: right;
`;

const Small = styled.small`
    font-size: .8em;
`;

const Line = styled.ul`
    margin: .5em 0 0 -.1em;
    padding: 0;
    list-style: none;
    text-align: center;
    font-size: 1.6em;
    line-height: 1;
`;

const Point = styled.li<{
    active: boolean;
}>`
    display: inline-block;
    margin-left: .1em;
    ${props => props.active ? null : `
        opacity: .5;
    `}

    &:before {
        content: "•"
    }
`;

export const View: React.StatelessComponent<{
    dispatch: Dispatch<Msg>;
    model: Model;
    amount: string;
    currencies: Array<Currency>;
    donor: Maybe<Currency>;
}> = ({ dispatch, model, amount, currencies, donor }) => (
    <Root>
        <div></div>

        {Utils.find(currency => currency.code === model.currency, currencies).cata({
            Nothing: () => null,
            Just: (currency: Currency) => (
                <div>
                    <Main>
                        {currency.code}

                        <Input
                            type="number"
                            value={amount}
                            onChange={event => dispatch({
                                $: 'CHANGE_AMOUNT',
                                _0: stringToAmount(event.currentTarget.value)
                            })}
                        />
                    </Main>

                    <Info>
                        <span>You have <Small>{currency.symbol}</Small>{currency.amount}</span>

                        {donor.chain(
                            donorCurrency => donorCurrency
                                .convertTo(1, currency)
                                .map(rate => ([ donorCurrency.symbol, Utils.round(2, rate) ]))
                        ).cata({
                            Nothing: () => (<span></span>),
                            Just: ([ symbol, rate ]) => (
                                <span>
                                    <Small>{currency.symbol}</Small>1 = <Small>{symbol}</Small>{rate}
                                </span>
                            )
                        })}
                    </Info>
                </div>
            )
        })}

        <Line>
            {currencies.map(currency => (
                <Point
                    active={currency.code === model.currency}
                    key={currency.code}
                />
            ))}
        </Line>
    </Root>
);
