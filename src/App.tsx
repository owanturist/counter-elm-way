import React from 'react';

import {
    Maybe,
    Nothing,
    Just
} from 'Fractal/Maybe';
import {
    Either,
    Left,
    Right
} from 'Fractal/Either';
import {
    Task
} from 'Fractal/Task';
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
import * as Changer from './Changer';

enum Changers {
    FROM = 'from',
    TO = 'to'
}

export type Msg
    = { $: 'NOOP' }
    | { $: 'FETCH_RATES' }
    | { $: 'FETCH_RATES_DONE'; _0: string; _1: Either<Http.Error, Array<[ string, number ]>> }
    | { $: 'CHANGER_MSG'; _0: Changers; _1: Changer.Msg }
    ;

export interface Model {
    cancelRequest: Maybe<Cmd<Msg>>;
    currencies: Array<Currency>;
    amount: Either<Maybe<number>, Maybe<number>>;
    changers: {
        [ Key in Changers ]: Changer.Model
    };
}

function find<T>(predicate: (value: T) => boolean, arr: Array<T>): Maybe<T> {
    for (const item of arr) {
        if (predicate(item)) {
            return Just(item);
        }
    }

    return Nothing;
}

const fetchRates = (base: string, currencies: Array<string>): [ Cmd<Msg>, Cmd<Msg> ] => {
    const [ cancel, request ] = Api.getRatesFor(base, currencies).toCancelableTask();

    return [
        Task.perform((): Msg => ({ $: 'NOOP' }), cancel),
        request.attempt((result): Msg => ({ $: 'FETCH_RATES_DONE', _0: base, _1: result }))
    ];
};

export const init = (): [ Model, Cmd<Msg> ] => {
    const initialModel: Model = {
        cancelRequest: Nothing,
        currencies: [
            Currency.of('USD', '$', 25.51),
            Currency.of('EUR', '€', 116.12),
            Currency.of('GBP', '£', 58.33)
        ],
        amount: Right(Nothing),
        /* There should be a checking for length of list with
         * extracting the values of first and second currencies
         * but we skip it now.
         */
        changers: {
            from: Changer.init('USD'),
            to: Changer.init('EUR')
        }
    };
    const [ cancelRequestCmd, fetchRatesCmd ] = fetchRates(
        initialModel.changers.from.currency,
        initialModel.currencies.map(currency => currency.code)
    );

    return [
        { ...initialModel, cancelRequest: Just(cancelRequestCmd) },
        fetchRatesCmd
    ];
};

export const update = (msg: Msg, model: Model): [ Model, Cmd<Msg> ] => {
    switch (msg.$) {
        case 'NOOP': {
            return [ model, Cmd.none ];
        }

        case 'FETCH_RATES': {
            const [ cancelRequestCmd, fetchRatesCmd ] = fetchRates(
                model.changers.from.currency,
                model.currencies.map(currency => currency.code)
            );

            return [
                {
                    ...model,
                    cancelRequest: Just(cancelRequestCmd)
                },
                fetchRatesCmd
            ];
        }

        case 'FETCH_RATES_DONE': {
            return [
                msg._1.cata({
                    Left: (_error: Http.Error) => {
                        // handle this arror as you want to

                        return { ...model, cancelRequest: Nothing };
                    },

                    Right: (rates: Array<[ string, number ]>) => ({
                        ...model,
                        cancelRequest: Nothing,
                        currencies: model.currencies.map(currency => {
                            if (currency.code !== msg._0) {
                                return currency;
                            }

                            return currency.registerRates(rates);
                        })
                    })
                }),
                Cmd.none
            ];
        }

        case 'CHANGER_MSG': {
            const stage = Changer.update(msg._1, msg._0 === Changers.FROM ? model.changers.from : model.changers.to);

            switch (stage.$) {
                case 'UPDATED': {
                    const [ nextFrom, nextTo ] = msg._0 === Changers.FROM
                        ? [ stage._0, model.changers.to ]
                        : [ model.changers.from, stage._0 ];
                    const nextModel = {
                        ...model,
                        changers: {
                            from: nextFrom,
                            to: nextTo
                        }
                    };
                    const currencyHasBeenChanged = nextFrom.currency !== model.changers.from.currency
                        || nextTo.currency !== model.changers.to.currency;


                    if (currencyHasBeenChanged && nextFrom.currency !== nextTo.currency) {
                        const [ cancelRequestCmd, fetchRatesCmd ] = fetchRates(nextFrom.currency, [ nextTo.currency ]);

                        return [
                            {
                                ...nextModel,
                                cancelRequest: Just(cancelRequestCmd)
                            },
                            Cmd.batch([
                                model.cancelRequest.getOrElse(Cmd.none),
                                fetchRatesCmd
                            ])
                        ];
                    }

                    return [ nextModel, Cmd.none ];
                }

                case 'AMOUNT_CHANGED': {
                    return [
                        {
                            ...model,
                            amount: msg._0 === Changers.FROM ? Right(stage._0) : Left(stage._0)
                        },
                        Cmd.none
                    ];
                }

                default: {
                    throw new Error('TS WAT?');
                }
            }
        }
    }
};

export const subscriptions = (_model: Model): Sub<Msg> => {
    return Sub.none;
};

export const View = ({ dispatch, model }: {
    dispatch: Dispatch<Msg>;
    model: Model;
}): JSX.Element => (
    <div>
        <h1>Amount: {model.amount.cata({
            Left: maybe => maybe.getOrElse(0),
            Right: maybe => maybe.getOrElse(0)
        })}</h1>

        <h2>{model.amount.isRight() && '*'}From:</h2>

        <Changer.View
            amount={model.amount.cata({
                Left: (amount: Maybe<number>) => Maybe.props({
                    amount,
                    to: find(currency => currency.code === model.changers.to.currency, model.currencies),
                    from: find(currency => currency.code === model.changers.from.currency, model.currencies)
                }).chain(acc => acc.to.convertFrom(acc.amount, acc.from)),
                Right: (amount: Maybe<number>) => amount
            })}
            rates={model.currencies}
            model={model.changers.from}
            dispatch={msg => dispatch({ $: 'CHANGER_MSG', _0: Changers.FROM, _1: msg })}
        />

        <h2>{model.amount.isLeft() && '*'}To:</h2>

        <Changer.View
            amount={model.amount.cata({
                Left: (amount: Maybe<number>) => amount,
                Right: (amount: Maybe<number>) => Maybe.props({
                    amount,
                    to: find(currency => currency.code === model.changers.to.currency, model.currencies),
                    from: find(currency => currency.code === model.changers.from.currency, model.currencies)
                }).chain(acc => acc.from.convertTo(acc.amount, acc.to))
            })}
            rates={model.currencies}
            model={model.changers.to}
            dispatch={msg => dispatch({ $: 'CHANGER_MSG', _0: Changers.TO, _1: msg })}
        />
    </div>
);
