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
import * as Time from 'Fractal/Time';
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
    amount: {
        source: Changers;
        value: Maybe<number>;
    };
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

const extractFormatedAmountFor = (source: Changers, model: Model): string => {
    if (model.amount.source === source) {
        return model.amount.value.map(amount => amount.toString()).getOrElse('');
    }

    return Maybe.props({
        amount: model.amount.value,
        to: find(currency => currency.code === model.changers.to.currency, model.currencies),
        from: find(currency => currency.code === model.changers.from.currency, model.currencies)
    }).chain(acc => source === Changers.FROM
        ? acc.from.convertTo(acc.amount, acc.to)
        : acc.to.convertFrom(acc.amount, acc.from)
    ).map(amount => amount.toFixed(2)).getOrElse('');
};

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
        amount: {
            source: Changers.FROM,
            value: Nothing
        },
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
                [ model.changers.to.currency ]
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
            const stage = Changer.update(msg._1, model.changers[ msg._0 ]);

            switch (stage.$) {
                case 'UPDATED': {
                    const nextModel = {
                        ...model,
                        changers: {
                            ...model.changers,
                            [ msg._0 ]: stage._0
                        }
                    };

                    if (
                        nextModel.changers.to.currency === nextModel.changers.from.currency
                        || (model.changers.from.currency === nextModel.changers.from.currency
                            && model.changers.to.currency === nextModel.changers.to.currency
                        )
                    ) {
                        return [ nextModel, Cmd.none ];
                    }

                    const [ cancelRequestCmd, fetchRatesCmd ] = fetchRates(
                        nextModel.changers.from.currency,
                        [ nextModel.changers.to.currency ]
                    );

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

                case 'AMOUNT_CHANGED': {
                    return [
                        {
                            ...model,
                            amount: {
                                source: msg._0,
                                value: stage._0
                            }
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

export const subscriptions = (model: Model): Sub<Msg> => model.cancelRequest.fold(
    () => Time.every(10000, (): Msg => ({ $: 'FETCH_RATES' })),
    () => Sub.none
);

export const View = ({ dispatch, model }: {
    dispatch: Dispatch<Msg>;
    model: Model;
}): JSX.Element => (
    <div>
        <h1>Amount: {model.amount.value.getOrElse(0)}</h1>

        <h2>{model.amount.source === Changers.FROM && '*'}From:</h2>

        <Changer.View
            amount={extractFormatedAmountFor(Changers.FROM, model)}
            rates={model.currencies}
            model={model.changers.from}
            dispatch={msg => dispatch({ $: 'CHANGER_MSG', _0: Changers.FROM, _1: msg })}
        />

        <h2>{model.amount.source === Changers.TO && '*'}To:</h2>

        <Changer.View
            amount={extractFormatedAmountFor(Changers.TO, model)}
            rates={model.currencies}
            model={model.changers.to}
            dispatch={msg => dispatch({ $: 'CHANGER_MSG', _0: Changers.TO, _1: msg })}
        />
    </div>
);
