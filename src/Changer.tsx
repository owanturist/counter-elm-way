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

interface Dragging {
    start: number;
    delta: Maybe<number>;
}

export interface Model {
    currency: string;
    dragging: Maybe<Dragging>;
}

export const isSame = (left: Model, right: Model): boolean => left.currency === right.currency;

export const init = (currency: string): Model => ({
    currency,
    dragging: Nothing
});

/**
 * U P D A T E
 */

export type Msg
    = { $: 'CHANGE_CURRENCY'; _0: string }
    | { $: 'CHANGE_AMOUNT'; _0: Maybe<number> }
    | { $: 'DRAG_START'; _0: number }
    | { $: 'DRAGGING'; _0: number; _1: number }
    | { $: 'DRAG_END' }
    ;

export type Stage
    = { $: 'UPDATED'; _0: boolean; _1: Model }
    | { $: 'AMOUNT_CHANGED'; _0: Maybe<number> }
    ;


const luft = (limit: number, delta: number): Maybe<number> => {
    if (delta > 0) {
        return delta - limit > 0 ? Just(delta - limit) : Nothing;
    }

    if (delta < 0) {
        return delta + limit < 0 ? Just(delta + limit) : Nothing;
    }

    return Nothing;
};

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

        case 'DRAG_START': {
            return {
                $: 'UPDATED',
                _0: false,
                _1: {
                    ...model,
                    dragging: Just({
                        start: msg._0,
                        delta: Nothing
                    })
                }
            };
        }

        case 'DRAGGING': {
            return {
                $: 'UPDATED',
                _0: false,
                _1: {
                    ...model,
                    dragging: Just({
                        start: msg._0,
                        delta: model.dragging.chain(dragging => dragging.delta).cata({
                            Nothing: () => luft(50, msg._1 - msg._0),
                            Just: () => Just(msg._1 - msg._0)
                        })
                    })
                }
            };
        }

        case 'DRAG_END': {
            return {
                $: 'UPDATED',
                _0: false,
                _1: {
                    ...model,
                    dragging: Nothing
                }
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
    flex-grow: 1;
    display: flex;
    flex-direction: column;
    padding: 1em 0;
    color: #fff;
    user-select: none;
    overflow-x: hidden;
`;

interface CarouselProps {
    shift?: number;
}

interface CarouselAttrs {
    style: {
        transform: string;
    };
}

const Carousel = styled.div.attrs<CarouselProps, CarouselAttrs>({
    style: props => ({
        transform: `translateX(${props.shift || 0}px)`
    })
})`
    flex: 1 0 auto;
    display: flex;
`;

const Slide = styled.label`
    box-sizing: border-box;
    flex: 1 0 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 2em;
`;

const Main = styled.div`
    display: flex;
    align-items: center;
    font-size: 2.4em;
    font-weight: 300;
    line-height: 1;
`;

const Info = styled.div`
    flex: 0 1 auto;
    display: flex;
    justify-content: space-between;
    margin-top: 1em;
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

    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
`;

const Small = styled.small`
    font-size: .8em;
`;

const Line = styled.ul`
    margin: .5em 0 0 -.1em;
    padding: 0 2em;
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
    ${props => props.active ? '' : `
        opacity: .5;
    `}

    &:before {
        content: "•"
    }
`;

interface DraggingMouseEvents<T> {
    onMouseDown?(event: React.MouseEvent<T>): void;
    onMouseMove?(event: React.MouseEvent<T>): void;
    onMouseUp?(event: React.MouseEvent<T>): void;
    onMouseLeave?(event: React.MouseEvent<T>): void;
}

function buildDraggingMouseEvents<T>(dispatch: Dispatch<Msg>, dragging: Maybe<Dragging>): DraggingMouseEvents<T> {
    return dragging.cata<DraggingMouseEvents<T>>({
        Nothing: () => ({
            onMouseDown: event => dispatch({ $: 'DRAG_START', _0: event.screenX })
        }),
        Just: ({ start }) => ({
            onMouseMove: event => dispatch({ $: 'DRAGGING', _0: start, _1: event.screenX }),
            onMouseUp: () => dispatch({ $: 'DRAG_END' }),
            onMouseLeave: () => dispatch({ $: 'DRAG_END' })
        })
    });
}

const ViewSlide: React.StatelessComponent<{
    dispatch: Dispatch<Msg>;
    amount: string;
    currency: Currency;
    donor: Maybe<Currency>;
}> = ({ dispatch, currency, amount, donor }) => (
    <Slide>
        <Main>
            {currency.code}

            <Input
                type="number"
                value={amount}
                step="0.01"
                onChange={event => dispatch({
                    $: 'CHANGE_AMOUNT',
                    _0: stringToAmount(event.currentTarget.value)
                })}
            />
        </Main>

        <Info>
            <span>You have <Small>{currency.symbol}</Small>{currency.amount}</span>

            {donor.chain(donorCurrency => donorCurrency.convertTo(1, currency).map(rate => (
                <span>
                    <Small>{currency.symbol}</Small>1 =
                    <Small>{donorCurrency.symbol}</Small>{Utils.round(2, rate)}
                </span>
            ))
            ).getOrElse(<span></span>)}
        </Info>
    </Slide>
);

export const View: React.StatelessComponent<{
    dispatch: Dispatch<Msg>;
    model: Model;
    amount: string;
    currencies: Array<Currency>;
    donor: Maybe<Currency>;
}> = ({ dispatch, model, amount, currencies, donor }) => (
    <Root {...buildDraggingMouseEvents(dispatch, model.dragging)}>
        {Utils.find(currency => currency.code === model.currency, currencies).cata({
            Nothing: () => null,
            Just: (currency: Currency) => (
                <Carousel shift={model.dragging.chain(dragging => dragging.delta).getOrElse(0)}>
                    <ViewSlide
                        dispatch={dispatch}
                        amount={amount}
                        currency={currency}
                        donor={donor}
                    />
                </Carousel>
            )
        })}

        <Line>
            {currencies.map(currency => (
                <Point
                    active={currency.code === model.currency}
                    onClick={() => dispatch({ $: 'CHANGE_CURRENCY', _0: currency.code })}
                    key={currency.code}
                />
            ))}
        </Line>
    </Root>
);
