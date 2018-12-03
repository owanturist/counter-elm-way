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

const DRAGGING_LUFT_GAP = 20;

type Dragging = Readonly<{
    ref: React.RefObject<HTMLDivElement>;
    start: number;
    delta: Maybe<number>;
}>;

type Sliding = Readonly<{
    currency: Maybe<Currency.ID>;
    duration: number;
    destination: number;
}>;

const SLIDING_SPEED = 1; // px/millisecond
const SLIDING_DURATION_MIN = 50; // millisecond
const SLIDING_DURATION_MAX = 300; // millisecond

const calcSlidingDuration = (distance: number): number => Utils.clamp(
    SLIDING_DURATION_MIN,
    SLIDING_DURATION_MAX,
    Math.abs(distance / SLIDING_SPEED)
);

export type Model = Readonly<{
    currency: Currency.ID;
    dragging: Maybe<Dragging>;
    sliding: Maybe<Sliding>;
}>;

export const init = (currency: Currency.ID): Model => ({
    currency,
    dragging: Nothing,
    sliding: Nothing
});

export const isSame = (first: Model, second: Model) => first.currency.isEqual(second.currency);

/**
 * U P D A T E
 */

export type Msg
    = { type: 'CHANGE_CURRENCY'; currency: Currency.ID }
    | { type: 'CHANGE_AMOUNT'; amount: string }
    | { type: 'DRAG_START'; start: number }
    | { type: 'DRAG'; prev: Maybe<Currency.ID>; next: Maybe<Currency.ID>; end: number; width: number }
    | { type: 'DRAG_END' }
    | { type: 'SLIDE_END' }
    ;

const ChangeCurrency = (currency: Currency.ID): Msg => ({ type: 'CHANGE_CURRENCY', currency });
const ChangeAmount = (amount: string): Msg => ({ type: 'CHANGE_AMOUNT', amount });
const DragStart = (start: number): Msg => ({ type: 'DRAG_START', start });
const Drag = (
    prev: Maybe<Currency.ID>,
    next: Maybe<Currency.ID>,
    end: number,
    width: number
): Msg => ({ type: 'DRAG', prev, next, end, width });
const DragEnd: Msg = { type: 'DRAG_END' };
const SlideEnd: Msg = { type: 'SLIDE_END' };

export type Stage
    = { type: 'UPDATED'; currencyChanged: boolean; model: Model }
    | { type: 'AMOUNT_CHANGED'; amount: string }
    ;

const Updated = (currencyChanged: boolean, model: Model): Stage => ({ type: 'UPDATED', currencyChanged, model });
const AmountChanged = (amount: string): Stage => ({ type: 'AMOUNT_CHANGED', amount });

const luft = (gap: number, delta: number): Maybe<number> => {
    if (delta - gap > 0) {
        return Just(delta - gap);
    }

    if (delta + gap < 0) {
        return Just(delta + gap);
    }

    return Nothing;
};

export const update = (msg: Msg, model: Model): Stage => {
    switch (msg.type) {
        case 'CHANGE_CURRENCY': {
            return Updated(true, {
                ...model,
                currency: msg.currency
            });
        }

        case 'CHANGE_AMOUNT': {
            return AmountChanged(msg.amount);
        }

        case 'DRAG_START': {
            return Updated(false, {
                ...model,
                dragging: Just({
                    ref: React.createRef<HTMLDivElement>(),
                    start: msg.start,
                    delta: Nothing
                })
            });
        }

        case 'DRAG': {
            return model.dragging.map(
                dragging => luft(DRAGGING_LUFT_GAP, msg.end - dragging.start).cata({
                    Nothing: () => Updated(false, {
                        ...model,
                        dragging: Just({
                            ...dragging,
                            delta: Nothing
                        })
                    }),

                    Just: delta => {
                        const border = Utils.clamp(100, 300, msg.width / 3);

                        if (delta < -border) {
                            return msg.next.cata({
                                Nothing: () => Updated(false, {
                                    ...model,
                                    dragging: Nothing,
                                    sliding: Just({
                                        currency: Nothing,
                                        duration: calcSlidingDuration(delta),
                                        destination: 0
                                    })
                                }),

                                Just: next => Updated(true, {
                                    ...model,
                                    currency: next,
                                    dragging: Nothing,
                                    sliding: Just({
                                        currency: Just(model.currency),
                                        duration: calcSlidingDuration(msg.width + delta),
                                        destination: -msg.width
                                    })
                                })
                            });
                        }

                        if (delta > border) {
                            return msg.prev.cata({
                                Nothing: () => Updated(false, {
                                    ...model,
                                    dragging: Nothing,
                                    sliding: Just({
                                        currency: Nothing,
                                        duration: calcSlidingDuration(delta),
                                        destination: 0
                                    })
                                }),

                                Just: prev => Updated(true, {
                                    ...model,
                                    currency: prev,
                                    dragging: Nothing,
                                    sliding: Just({
                                        currency: Just(model.currency),
                                        duration: calcSlidingDuration(msg.width - delta),
                                        destination: msg.width
                                    })
                                })
                            });
                        }

                        return Updated(false, {
                            ...model,
                            dragging: Just({
                                ...dragging,
                                delta: Just(delta)
                            })
                        });
                    }
                })
            ).getOrElse(Updated(false, {
                ...model,
                dragging: Nothing
            }));
        }

        case 'DRAG_END': {
            return Updated(false, model.dragging.chain(dragging => dragging.delta).cata({
                Nothing: () => ({
                    ...model,
                    dragging: Nothing
                }),

                Just: delta => ({
                    ...model,
                    dragging: Nothing,
                    sliding: Just({
                        currency: Nothing,
                        duration: calcSlidingDuration(delta),
                        destination: 0
                    })
                })
            }));
        }

        case 'SLIDE_END': {
            return Updated(false, {
                ...model,
                sliding: Nothing
            });
        }
    }
};

export const subscriptions = (model: Model): Sub<Msg> => {
    return model.sliding.cata({
        Nothing: () => Sub.none,
        Just: sliding => Time.every(sliding.duration, () => SlideEnd)
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
    sliding: Maybe<Sliding>;
    prev: Maybe<Currency>;
    next: Maybe<Currency>;
}

interface CarouselAttrs {
    style: {
        [ property: string ]: string;
    };
}

const Carousel = styled.div.attrs<CarouselProps, CarouselAttrs>({
    style: props => props.sliding.cata({
        Nothing: () => ({
            transform: `translate3d(${props.shift}px, 0, 0)`
        }),

        Just: sliding => ({
            transform: `translate3d(${sliding.destination}px, 0, 0)`,
            transition: `transform ${sliding.duration}ms ease-out`
        })
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

Carousel.displayName = 'Carousel';

const Main = styled.div`
    display: flex;
    align-items: center;
    font-size: 3em;
    font-weight: 300;
    line-height: 1;
`;

const Info = styled.div`
    flex: 0 1 auto;
    display: flex;
    justify-content: space-between;
    margin-top: .5em;
    opacity: .6;
`;

const Input = styled.input`
    width: 100%;
    padding: 0 0 0 .25em;
    border: none;
    background: transparent;
    font: inherit;
    color: inherit;
    outline: none;
    text-align: right;
    -moz-appearance: textfield;

    &::-webkit-inner-spin-button,
    &::-webkit-outer-spin-button {
        -webkit-appearance: none;
        margin: 0;
    }
`;

Input.displayName = 'Input';

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

Line.displayName = 'Line';

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

Point.displayName = 'Point';

export const stringToAmount = (input: string): string => {
    return input
        .replace(/,/g, '.')                       // replace all commas to decimals
        .replace(/[^0-9^\-^.]/g, '')              // keep only numbers, minuses and decimal
        .replace(/^(-?)0+(?!(\.|$))/, '$1')       // remove leading zeros
        .replace(/^(-?)\./, '$10.')               // add zero before leading decimal
        .replace(/(^-?\d*(\.\d{0,2})?).*/, '$1'); // format output number
};

export const negateAmount = (amount: string): string => {
    return /^-/.test(amount) ? amount.replace(/^-/, '') : `-${amount}`;
};

const Rate: React.StatelessComponent<{
    currencySymbol: string;
    pairSymbol: string;
    rate: number;
}> = ({ currencySymbol, pairSymbol, rate }) => (
    <span>
        <Small>{currencySymbol}</Small>1&nbsp;=&nbsp;
        <Small>{pairSymbol}</Small>{rate.toFixed(2)}
    </span>
);

const Slide = styled<{
    dispatch: Dispatch<Msg>;
    amount: string;
    currency: Currency;
    pair: Maybe<Currency>;
    preventClicking: boolean;
    className?: string;
} & React.InputHTMLAttributes<HTMLInputElement>>(({
    dispatch,
    currency,
    amount,
    pair,
    className,
    preventClicking,
    ...inputProps
}) => (
    <label className={className} onClick={event => {
        if (preventClicking) {
            event.preventDefault();
        }
    }}>
        <Main>
            {currency.code.toString()}

            <Input
                type="text"
                inputMode="numeric"
                value={amount}
                onChange={event => dispatch(ChangeAmount(stringToAmount(event.currentTarget.value)))}
                onKeyPress={event => {
                    if (event.key === '-') {
                        dispatch(ChangeAmount(negateAmount(amount)));

                        event.preventDefault();
                    }
                }}
                {...inputProps}
            />
        </Main>

        <Info>
            <span>You have <Small>{currency.symbol}</Small>{Utils.floor(2, currency.amount).toFixed(2)}</span>

            {pair.chain(pairCurrency => Utils.stringToNumber(amount).getOrElse(0) >= 0
                ? pairCurrency
                    .convertTo(1, currency.code)
                    .map(rate => (
                        <Rate
                            currencySymbol={currency.symbol}
                            pairSymbol={pairCurrency.symbol}
                            rate={Utils.ceil(2, rate)}
                        />
                    ))
                : currency
                    .convertFrom(1, pairCurrency.code)
                    .map(rate => (
                        <Rate
                            currencySymbol={currency.symbol}
                            pairSymbol={pairCurrency.symbol}
                            rate={Utils.floor(2, rate)}
                        />
                    ))
            ).getOrElse(<span />)}
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

Slide.displayName = 'Slide';

const extractCurrencies = (currencies: Array<Currency>, currentCode: Currency.ID): Maybe<{
    prev: Maybe<Currency>;
    current: Currency;
    next: Maybe<Currency>;
}> => {
    const { prev, current, next } = currencies.reduce((acc, currency) => {
        if (currency.code.isEqual(currentCode)) {
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
        prev: Nothing,
        current: Nothing as Maybe<Currency>,
        next: Nothing
    });

    return current.map(currency => ({
        prev,
        current: currency,
        next
    }));
};

interface DraggingMouseEvents<T> {
    onTouchStart?(event: React.TouchEvent<T>): void;
    onTouchMove?(event: React.TouchEvent<T>): void;
    onTouchEnd?(event: React.TouchEvent<T>): void;
}

function buildDraggingMouseEvents<T>(
    dispatch: Dispatch<Msg>,
    prev: Maybe<Currency.ID>,
    next: Maybe<Currency.ID>,
    dragging: Maybe<Dragging>
): DraggingMouseEvents<T> {
    return dragging.cata<DraggingMouseEvents<T>>({
        Nothing: () => ({
            onTouchStart: event => dispatch(
                Maybe.fromNullable(event.touches[ 0 ]).cata({
                    Nothing: () => DragEnd,
                    Just: touch => DragStart(touch.screenX)
                })
            )
        }),
        Just: ({ ref }) => ({
            ref,
            onTouchMove: event => dispatch(
                Maybe.props({
                    touch: Maybe.fromNullable(event.touches[ 0 ]),
                    node: Maybe.fromNullable(ref.current)
                }).cata({
                    Nothing: () => DragEnd,
                    Just: ({ touch, node }) => Drag(prev, next, touch.screenX, node.clientWidth)
                })
            ),
            onTouchEnd: () => dispatch(DragEnd)
        })
    });
}

export const View: React.StatelessComponent<{
    dispatch: Dispatch<Msg>;
    model: Model;
    amount: string;
    currencies: Array<Currency>;
    pair: Maybe<Currency>;
    autoFocus?: boolean;
}> = ({ dispatch, model, amount, currencies, pair, autoFocus }) => extractCurrencies(
    currencies,
    model.sliding.chain(sliding => sliding.currency).getOrElse(model.currency)
).fold(() => null, ({ prev, current, next }) => (
    <Root {...model.sliding.isJust() ? {} : buildDraggingMouseEvents(
        dispatch,
        prev.map(currency => currency.code),
        next.map(currency => currency.code),
        model.dragging
    )}>
        <Carousel
            shift={model.dragging.chain(dragging => dragging.delta).getOrElse(0)}
            sliding={model.sliding}
            prev={prev}
            next={next}
        >
            {prev.fold(() => null, currency => (
                <Slide
                    dispatch={dispatch}
                    amount=""
                    currency={currency}
                    pair={pair}
                    preventClicking={model.sliding.isJust()}
                    disabled
                />
            ))}

            <Slide
                dispatch={dispatch}
                amount={amount}
                currency={current}
                pair={pair}
                autoFocus={autoFocus}
                preventClicking={model.sliding.isJust()}
            />

            {next.fold(() => null, currency => (
                <Slide
                    dispatch={dispatch}
                    amount=""
                    currency={currency}
                    pair={pair}
                    preventClicking={model.sliding.isJust()}
                    disabled
                />
            ))}
        </Carousel>

        <Line>
            {currencies.map(currency => (
                <Point
                    active={currency.code.isEqual(model.currency)}
                    onClick={() => dispatch(ChangeCurrency(currency.code))}
                    key={currency.code.toString()}
                />
            ))}
        </Line>
    </Root>
));
