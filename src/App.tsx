import * as React from 'react';
import styled from 'styled-components';

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
import * as CurrencySelector from './CurrencySelector';
import * as Utils from './Utils';

/**
 * M O D E L
 */

enum Changers {
    FROM = 'from',
    TO = 'to'
}

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

const areChangersSame = (model: Model): boolean => Changer.isSame(model.changers.from, model.changers.to);

const getCurrencyOfChanger = (source: Changers, model: Model): Maybe<Currency> => {
    return Utils.find(currency => currency.code === model.changers[ source ].currency, model.currencies);
};

const normalize = (model: Model): Model => {
    if (model.amount.source === Changers.FROM) {
        return model;
    }

    return {
        ...model,
        amount: {
            source: Changers.FROM,
            value: Maybe.props({
                amount: model.amount.value,
                to: getCurrencyOfChanger(Changers.TO, model),
                from: getCurrencyOfChanger(Changers.FROM, model)
            }).chain(
                acc => acc.from.convertTo(-acc.amount, acc.to)
            ).map(amount => Utils.round(2, amount))
        }
    };
};

const limit = (model: Model): Model => model.amount.value.map(amount => {
    const minimum = getCurrencyOfChanger(model.amount.source, model).map(
        currency => Utils.round(2, -currency.amount)
    ).getOrElse(amount);

    if (amount < minimum) {
        return {
            ...model,
            amount: {
                ...model.amount,
                value: Just(minimum)
            }
        };
    }

    if (areChangersSame(model)) {
        if (amount <= -minimum /* aka maximum */) {
            return model;
        }

        return {
            ...model,
            amount: {
                ...model.amount,
                value: Just(-minimum)
            }
        };
    }

    const maximum = Maybe.props({
        to: getCurrencyOfChanger(Changers.TO, model),
        from: getCurrencyOfChanger(Changers.FROM, model)
    }).chain(
        acc => model.amount.source === Changers.FROM
            ? acc.from.convertTo(acc.to.amount, acc.to)
            : acc.to.convertFrom(acc.from.amount, acc.from)
    ).map(max => Utils.round(2, max)).getOrElse(amount);

    if (amount > maximum) {
        return {
            ...model,
            amount: {
                ...model.amount,
                value: Just(maximum)
            }
        };
    }

    return model;
}).getOrElse(model);

/**
 * U P D A T E
 */

export type Msg
    = { $: 'NOOP' }
    | { $: 'FETCH_RATES' }
    | { $: 'FETCH_RATES_DONE'; _0: string; _1: Either<Http.Error, Array<[ string, number ]>> }
    | { $: 'EXCHANGE'; _0: string; _1: string; _2: number }
    | { $: 'CHANGER_MSG'; _0: Changers; _1: Changer.Msg }
    ;

const fetchRates = (base: string, currencies: Array<string>): [ Cmd<Msg>, Cmd<Msg> ] => {
    const [ cancel, request ] = Api.getRatesFor(base, currencies).toCancelableTask();

    return [
        Task.perform((): Msg => ({ $: 'NOOP' }), cancel),
        request.attempt((result): Msg => ({ $: 'FETCH_RATES_DONE', _0: base, _1: result }))
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
                    Left: (error: Http.Error) => {
                        // handle the error as you want to
                        // tslint:disable-next-line:no-console
                        console.log(error);

                        return { ...model, cancelRequest: Nothing };
                    },

                    Right: (rates: Array<[ string, number ]>) => limit({
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

        case 'EXCHANGE': {
            // tslint:disable-next-line:no-console
            console.log(`Exchange ${msg._2} of ${msg._0} to ${msg._1}`);

            return [
                {
                    ...model,
                    amount: {
                        ...model.amount,
                        value: Nothing
                    }
                },
                Cmd.none
            ];
        }

        case 'CHANGER_MSG': {
            const stage = Changer.update(msg._1, model.changers[ msg._0 ]);

            switch (stage.$) {
                case 'UPDATED': {
                    if (!stage._0) {
                        return [
                            {
                                ...model,
                                changers: {
                                    ...model.changers,
                                    [ msg._0 ]: stage._1
                                }
                            },
                            Cmd.none
                        ];
                    }

                    const nextModel = limit({
                        ...normalize(model),
                        changers: {
                            ...model.changers,
                            [ msg._0 ]: stage._1
                        }
                    });

                    if (areChangersSame(nextModel)) {
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
                        limit({
                            ...model,
                            amount: {
                                source: msg._0,
                                value: stage._0
                            }
                        }),
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

/**
 * S U B S C R I P T I O N S
 */

export const subscriptions = (model: Model): Sub<Msg> => {
    if (areChangersSame(model)) {
        return Sub.none;
    }

    return model.cancelRequest.cata({
        Nothing: () => Time.every(10000, (): Msg => ({ $: 'FETCH_RATES' })),
        Just: () => Sub.none
    });
};

/**
 * V I E W
 */

const extractFormatedAmountFor = (source: Changers, model: Model): string => {
    if (model.amount.source === source) {
        return model.amount.value.map(amount => amount.toString()).getOrElse('');
    }

    return Maybe.props({
        amount: model.amount.value,
        to: getCurrencyOfChanger(Changers.TO, model),
        from: getCurrencyOfChanger(Changers.FROM, model)
    }).chain(acc => source === Changers.FROM
        ? acc.from.convertTo(-acc.amount, acc.to)
        : acc.to.convertFrom(-acc.amount, acc.from)
    ).map(amount => amount.toFixed(2)).getOrElse('');
};

const Root = styled.div`
    display: flex;
    flex-direction: column;
    height: 100%;
    font: 14px/${(20 / 14).toFixed(3)} Helvetica;
    background: rgb(45, 120, 245);
`;

const Header = styled.header`
    flex: 0 0 auto;
    display: flex;
    justify-content: space-between;
    line-height: 1;
`;

const MenuItemContainer = styled.div<{
    align: 'flex-start' | 'center' | 'flex-end';
}>`
    flex: 1 0 ${props => props.align === 'center' ? 'auto' : '30%'};
    display: flex;
    justify-content: ${props => props.align};
    align-items: center;
`;

const MenuButton = styled.button<{
    disabled?: boolean;
}>`
    padding: 1em .5em;
    border: none;
    outline: none;
    color: #fff;
    background: transparent;
    font-weight: 300;
    ${({ disabled = false }) => disabled ? `
        opacity: .4;
    ` : null}
`;

const Content = styled.div`
    flex: 1 0 auto;
    display: flex;
    flex-direction: column;
`;

const ChangerContainer = styled.div<{
    source: Changers;
}>`
    flex: 1 0 50%;
    position: relative;
    background: ${props => props.source === Changers.TO ? 'rgba(0, 0, 0, .25)' : null};
    ${props => props.source === Changers.FROM ? `
        padding-bottom: 15px;
        ` : `
        &:before,
        &:after {
            content: "";
            position: absolute;
            bottom: 100%;
            height: 1em;
            border: 0 solid rgba(0, 0, 0, .25);
        }

        &:before {
            right: 50%;
            left: 0;
            border-right-color: transparent;
            border-width: 0 15px 15px 0;
        }

        &:after {
            right: 0;
            left: 50%;
            border-left-color: transparent;
            border-width: 0 0 15px 15px;
        }
    `}
`;

export const View: React.StatelessComponent<{
    dispatch: Dispatch<Msg>;
    model: Model;
}> = ({ dispatch, model }) => {
    const from = getCurrencyOfChanger(Changers.FROM, model);
    const to = getCurrencyOfChanger(Changers.TO, model);

    return (
        <Root>
            <Header>
                <MenuItemContainer align="flex-start">
                    <MenuButton>Cancel</MenuButton>
                </MenuItemContainer>

                <MenuItemContainer align="center">
                    {!areChangersSame(model) && Maybe.props({ from, to }).cata({
                        Nothing: () => null,
                        Just: acc => <CurrencySelector.View from={acc.from} to={acc.to} />
                    })}
                </MenuItemContainer>

                <MenuItemContainer align="flex-end">
                    {Maybe.props({ from, to, amount: model.amount.value }).chain(acc => {
                        if (acc.amount === 0) {
                            return Nothing;
                        }

                        if (model.amount.source === Changers.FROM) {
                            return Just({
                                from: acc.from.code,
                                to: acc.to.code,
                                amount: acc.amount
                            });
                        }

                        return acc.from.convertTo(-acc.amount, acc.to).map(amount => ({
                            from: acc.from.code,
                            to: acc.to.code,
                            amount: Utils.round(2, amount)
                        }));
                    }).cata({
                        Nothing: () => (
                            <MenuButton disabled>Exchange</MenuButton>
                        ),
                        Just: acc => (
                            <MenuButton
                                onClick={() => dispatch({
                                    $: 'EXCHANGE',
                                    _0: acc.from,
                                    _1: acc.to,
                                    _2: acc.amount
                                })}
                            >Exchange</MenuButton>
                        )
                    })}
                </MenuItemContainer>
            </Header>

            <Content>
                <ChangerContainer source={Changers.FROM}>
                    <Changer.View
                        amount={extractFormatedAmountFor(Changers.FROM, model)}
                        currencies={model.currencies}
                        donor={Nothing}
                        model={model.changers.from}
                        dispatch={msg => dispatch({ $: 'CHANGER_MSG', _0: Changers.FROM, _1: msg })}
                    />
                </ChangerContainer>

                <ChangerContainer source={Changers.TO}>
                    <Changer.View
                        amount={extractFormatedAmountFor(Changers.TO, model)}
                        currencies={model.currencies}
                        donor={areChangersSame(model) ? Nothing : from}
                        model={model.changers.to}
                        dispatch={msg => dispatch({ $: 'CHANGER_MSG', _0: Changers.TO, _1: msg })}
                    />
                </ChangerContainer>
            </Content>
        </Root>
    );
};
