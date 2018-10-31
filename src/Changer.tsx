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
    Sub
} from 'Fractal/Platform/Sub';

import {
    Currency
} from './Currency';
import * as Utils from './Utils';
import * as Time from 'Fractal/Time';

/**
 * M O D E L
 */

interface Dragging {
    ref: React.RefObject<HTMLDivElement>;
    start: number;
    end: number;
}

interface Sliding {
    currency: string;
    end: number;
}

export interface Model {
    currency: string;
    dragging: Maybe<Dragging>;
    sliding: Maybe<Sliding>;
}

export const init = (currency: string): Model => ({
    currency,
    dragging: Nothing,
    sliding: Nothing
});

export const isSame = (left: Model, right: Model): boolean => left.currency === right.currency;

/**
 * U P D A T E
 */

export type Msg
    = { $: 'CHANGE_CURRENCY'; _0: string }
    | { $: 'CHANGE_AMOUNT'; _0: Maybe<string> }
    | { $: 'DRAG_START'; _0: number }
    | { $: 'DRAGGING'; _0: number }
    | { $: 'DRAG_END' }
    | { $: 'SLIDE_END' }
    ;

export type Stage
    = { $: 'UPDATED'; _0: boolean; _1: Model }
    | { $: 'AMOUNT_CHANGED'; _0: Maybe<string> }
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

        case 'DRAG_START': {
            return {
                $: 'UPDATED',
                _0: false,
                _1: {
                    ...model,
                    dragging: Just({
                        ref: React.createRef() as React.RefObject<HTMLDivElement>,
                        start: msg._0,
                        end: msg._0
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
                    dragging: model.dragging.map(dragging => ({
                        ...dragging,
                        end: msg._0
                    }))
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

        case 'SLIDE_END': {
            return {
                $: 'UPDATED',
                _0: false,
                _1: {
                    ...model,
                    sliding: Nothing
                }
            };
        }
    }
};

export const subscriptions = (model: Model): Sub<Msg> => {
    return model.sliding.cata({
        Nothing: () => Sub.none,
        Just: () => Time.every(1000, (): Msg => ({ $: 'SLIDE_END' }))
    });
};

/**
 * V I E W
 */

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
    shift: number;
    sliding: Maybe<number>;
    prev: Maybe<Currency>;
    next: Maybe<Currency>;
}

interface CarouselAttrs {
    style: {
        transform: string;
    };
}

const Carousel = styled.div.attrs<CarouselProps, CarouselAttrs>({
    style: props => ({
        transform: `translateX(${props.sliding.getOrElse(props.shift)}px)`
    })
})`
    flex: 1 0 auto;
    display: flex;
    justify-content: ${props => {
        if (props.prev.isNothing()) {
            return 'flex-start';
        }

        if (props.next.isNothing()) {
            return 'flex-end';
        }

        return 'center';
    }};
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
    padding: 0 0 0 1em;
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

const calculateStep = (amount: string): number => {
    if (/(\.|,)\d[1-9]\d*/.test(amount)) {
        return 0.01;
    }

    if (/(\.|,)[1-9]\d*/.test(amount)) {
        return 0.1;
    }

    return 1;
};

const stringToAmount = (input: string): Maybe<string> => {
    const result = input.trim().replace(/^(-|\+)?(-|\+)*(0*(?=\d+))?(\d*(\.|,)?\d{0,2})(.*)$/, '$1$4');

    return result === '' ? Nothing : Just(result);
};

const Slide = styled<{
    dispatch: Dispatch<Msg>;
    amount: string;
    currency: Currency;
    donor: Maybe<Currency>;
    className?: string;
    autoFocus?: boolean;
}>(({ dispatch, currency, amount, donor, className, autoFocus }) => (
    <label className={className}>
        <Main>
            {currency.code}

            <Input
                type="number"
                value={amount}
                step={calculateStep(amount).toString()}
                autoFocus={autoFocus}
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
                    <Small>{currency.symbol}</Small>1&nbsp;=&nbsp;
                    <Small>{donorCurrency.symbol}</Small>{Utils.round(2, rate)}
                </span>
            ))
            ).getOrElse(<span></span>)}
        </Info>
    </label>
))`
    box-sizing: border-box;
    flex: 1 0 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 2em;
`;

const limit = (limit: number, prev: Maybe<Currency>, next: Maybe<Currency>, dragging: Dragging): Maybe<number> => {
    const delta = dragging.end - dragging.start;

    if (delta > 0) {
        if (prev.isNothing()) {
            return Nothing;
        }

        return delta - limit > 0 ? Just(delta - limit) : Nothing;
    }

    if (delta < 0) {
        if (next.isNothing()) {
            return Nothing;
        }

        return delta + limit < 0 ? Just(delta + limit) : Nothing;
    }

    return Nothing;
};

const extractCurrencies = (currencies: Array<Currency>, currentCode: string): Maybe<{
    prev: Maybe<Currency>;
    current: Currency;
    next: Maybe<Currency>;
}> => {
    const { prev, current, next } = currencies.reduce((acc, currency) => {
        if (currency.code === currentCode) {
            return { ...acc, current: Just(currency) };
        }

        if (acc.current.isNothing()) {
            return { ...acc, prev: Just(currency) };
        }

        if (acc.next.isNothing()) {
            return { ...acc, next: Just(currency) };
        }

        return acc;
    }, {
        prev: Nothing as Maybe<Currency>,
        current: Nothing as Maybe<Currency>,
        next: Nothing as Maybe<Currency>
    });

    return current.map(currency => ({
        prev,
        current: currency,
        next
    }));
};

interface DraggingMouseEvents<T> {
    onMouseDown?(event: React.MouseEvent<T>): void;
    onMouseMove?(event: React.MouseEvent<T>): void;
    onMouseUp?(event: React.MouseEvent<T>): void;
    onMouseLeave?(event: React.MouseEvent<T>): void;
}

function buildDraggingMouseEvents<T>(
    dispatch: Dispatch<Msg>,
    dragging: Maybe<Dragging>
): DraggingMouseEvents<T> {
    return dragging.cata<DraggingMouseEvents<T>>({
        Nothing: () => ({
            onMouseDown: event => dispatch({ $: 'DRAG_START', _0: event.screenX })
        }),
        Just: ({ ref }) => ({
            ref,
            onMouseMove: event => dispatch({ $: 'DRAGGING', _0: event.screenX }),
            onMouseUp: () => dispatch({ $: 'DRAG_END' }),
            onMouseLeave: () => dispatch({ $: 'DRAG_END' })
        })
    });
}

export const View: React.StatelessComponent<{
    dispatch: Dispatch<Msg>;
    model: Model;
    amount: string;
    currencies: Array<Currency>;
    donor: Maybe<Currency>;
    autoFocus?: boolean;
}> = ({ dispatch, model, amount, currencies, donor, autoFocus }) => (
    <Root>
        {extractCurrencies(
            currencies,
            model.sliding.map(sliding => sliding.currency).getOrElse(model.currency)
        ).cata({
            Nothing: () => null,
            Just: ({ prev, current, next }) => (
                <Carousel
                    shift={model.dragging.chain(dragging => limit(20, prev, next, dragging)).getOrElse(0)}
                    sliding={Nothing}
                    prev={prev}
                    next={next}
                    {...model.sliding.isJust() ? {} : buildDraggingMouseEvents(dispatch, model.dragging)}
                >
                    {prev.cata({
                        Nothing: () => null,
                        Just: currency => (
                            <Slide
                                dispatch={dispatch}
                                amount=""
                                currency={currency}
                                donor={donor}
                                key={currency.code}
                            />
                        )
                    })}

                    <Slide
                        dispatch={dispatch}
                        amount={amount}
                        currency={current}
                        donor={donor}
                        autoFocus={autoFocus}
                        key={current.code}
                    />

                    {next.cata({
                        Nothing: () => null,
                        Just: currency => (
                            <Slide
                                dispatch={dispatch}
                                amount=""
                                currency={currency}
                                donor={donor}
                                key={currency.code}
                            />
                        )
                    })}
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
