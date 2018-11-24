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

export enum Changers {
    FROM = 'from',
    TO = 'to'
}

type Amount = Readonly<{
    source: Changers;
    value: Maybe<string>;
}>;

export type Model = Readonly<{
    cancelRequest: Maybe<Cmd<Msg>>;
    currencies: Array<Currency>;
    amount: Amount;
    changers: {
        [ Key in Changers ]: Changer.Model
    };
}>;

export const init = (currencies: Array<Currency>, from: string, to: string): [ Model, Cmd<Msg> ] => {
    const initialModel: Model = {
        cancelRequest: Nothing,
        currencies,
        amount: {
            source: Changers.FROM,
            value: Nothing
        },
        changers: {
            from: Changer.init(from),
            to: Changer.init(to)
        }
    };
    const [ cancelRequestCmd, fetchRatesCmd ] = fetchRates(
        from,
        initialModel.currencies.map(currency => currency.code)
    );

    return [
        { ...initialModel, cancelRequest: Just(cancelRequestCmd) },
        fetchRatesCmd
    ];
};

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
                amount: model.amount.value.chain(Utils.stringToNumber),
                to: getCurrencyOfChanger(Changers.TO, model),
                from: getCurrencyOfChanger(Changers.FROM, model)
            })
                .chain(acc => acc.from.convertTo(-acc.amount, acc.to))
                .map(amount => amount.toFixed(2))
        }
    };
};

const limit = (model: Model): Model => model.amount.value.chain(Utils.stringToNumber).map(amount => {
    const minimum = getCurrencyOfChanger(model.amount.source, model).map(
        currency => Utils.trunc(2, -currency.amount)
    ).getOrElse(amount);

    if (amount < minimum) {
        return {
            ...model,
            amount: {
                ...model.amount,
                value: Just(minimum.toString())
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
    ).map(max => Utils.trunc(2, max)).getOrElse(amount);

    if (amount > maximum) {
        return {
            ...model,
            amount: {
                ...model.amount,
                value: Just(maximum.toString())
            }
        };
    }

    return model;
}).getOrElse(model);

/**
 * U P D A T E
 */

export type Msg
    = { type: 'NOOP' }
    | { type: 'FETCH_RATES' }
    | { type: 'FETCH_RATES_DONE'; base: string; result: Either<Http.Error, Array<[ string, number ]>> }
    | { type: 'EXCHANGE'; from: Currency; amountFrom: number; to: Currency; amountTo: number }
    | { type: 'CHANGER_MSG'; source: Changers; changerMsg: Changer.Msg }
    ;

const NoOp: Msg = { type: 'NOOP' };
const FetchRates: Msg = { type: 'FETCH_RATES' };
const FetchRatesDone = (
    base: string,
    result: Either<Http.Error, Array<[ string, number ]>>
): Msg => ({ type: 'FETCH_RATES_DONE', base, result });
const Exchange = (
    from: Currency,
    amountFrom: number,
    to: Currency,
    amountTo: number
): Msg => ({ type: 'EXCHANGE', from, amountFrom, to, amountTo });
const ChangerMsg = (source: Changers, changerMsg: Changer.Msg): Msg => ({ type: 'CHANGER_MSG', source, changerMsg });

const fetchRates = (base: string, currencies: Array<string>): [ Cmd<Msg>, Cmd<Msg> ] => {
    const [ cancel, request ] = Api.getRatesFor(base, currencies).toCancelableTask();

    return [
        cancel.perform(() => NoOp),
        request.attempt(result => FetchRatesDone(base, result))
    ];
};

export const update = (msg: Msg, model: Model): [ Model, Cmd<Msg> ] => {
    switch (msg.type) {
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
                msg.result.cata({
                    Left: (_error: Http.Error) => {
                        // handle the error as you want to
                        // tslint:disable-next-line:no-console
                        return { ...model, cancelRequest: Nothing };
                    },

                    Right: (rates: Array<[ string, number ]>) => limit({
                        ...model,
                        cancelRequest: Nothing,
                        currencies: model.currencies.map(currency => {
                            if (currency.code !== msg.base) {
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
            const nextCurrencies = model.currencies.map(currency => {
                switch (currency.code) {
                    case model.changers.from.currency: {
                        return currency.change(msg.amountFrom);
                    }

                    case model.changers.to.currency: {
                        return currency.change(msg.amountTo);
                    }

                    default: {
                        return currency;
                    }
                }
            });

            return [
                {
                    ...model,
                    currencies: nextCurrencies,
                    amount: {
                        ...model.amount,
                        value: Nothing
                    }
                },
                Cmd.none
            ];
        }

        case 'CHANGER_MSG': {
            const stage = Changer.update(msg.changerMsg, model.changers[ msg.source ]);

            switch (stage.type) {
                case 'UPDATED': {
                    if (!stage.currencyChanged) {
                        return [
                            {
                                ...model,
                                changers: {
                                    ...model.changers,
                                    [ msg.source ]: stage.model
                                }
                            },
                            Cmd.none
                        ];
                    }

                    const nextModel = limit({
                        ...normalize(model),
                        changers: {
                            ...model.changers,
                            [ msg.source ]: stage.model
                        }
                    });

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
                                source: msg.source,
                                value: stage.amount
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

export const subscriptions = (model: Model): Sub<Msg> => Sub.batch([
    Changer.subscriptions(model.changers.from).map(changerMsg => ChangerMsg(Changers.FROM, changerMsg)),
    Changer.subscriptions(model.changers.to).map(changerMsg => ChangerMsg(Changers.TO, changerMsg)),
    model.cancelRequest.cata({
        Nothing: () => Time.every(10000, () => FetchRates),
        Just: () => Sub.none
    })
]);

/**
 * V I E W
 */

const extractFormatedAmountFor = (
    source: Changers,
    from: Maybe<Currency>,
    to: Maybe<Currency>,
    amount: Amount
): string => {
    if (amount.source === source) {
        return amount.value.getOrElse('');
    }

    return Maybe.props({
        to,
        from,
        amount: amount.value.chain(Utils.stringToNumber)
    }).chain(acc => source === Changers.FROM
        ? acc.from.convertTo(-acc.amount, acc.to)
        : acc.to.convertFrom(-acc.amount, acc.from)
    ).map(amount => Utils.trunc(2, amount).toFixed(2)).getOrElse('');
};

const getExchangeResult = (from: Maybe<Currency>, to: Maybe<Currency>, amount: Amount): Maybe<{
    from: Currency;
    to: Currency;
    amountFrom: number;
    amountTo: number;
}> => Maybe.props({
    from,
    to,
    amount: amount.value.chain(Utils.stringToNumber)
}).chain(acc => amount.source === Changers.FROM
    ? acc.to.convertFrom(-acc.amount, acc.from).map(amountTo => ({
        from: acc.from,
        to: acc.to,
        amountFrom: Utils.trunc(2, acc.amount),
        amountTo: Utils.trunc(2, amountTo)
    }))
    : acc.from.convertTo(-acc.amount, acc.to).map(amountFrom => ({
        from: acc.from,
        to: acc.to,
        amountFrom: Utils.trunc(2, amountFrom),
        amountTo: Utils.trunc(2, acc.amount)
    }))
).chain(acc => acc.amountFrom === 0 || acc.amountTo === 0 ? Nothing : Just(acc));

const Root = styled.form`
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
    cursor: pointer;
    ${({ disabled = false }) => disabled ? `
        opacity: .4;
        cursor: not-allowed;
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
    display: flex;
    position: relative;
    background: ${props => props.source === Changers.TO ? 'rgba(0, 0, 0, .25)' : null};
    ${props => props.source === Changers.FROM ? `
        padding-bottom: 1em;
        ` : `
        &:before,
        &:after {
            content: "";
            position: absolute;
            top: 0;
            margin-top: -2em;
            height: 1em;
            border: 0 solid rgba(0, 0, 0, .25);
        }

        &:before {
            right: 50%;
            left: 0;
            border-right-color: transparent;
            border-width: 0 1em 1em 0;
        }

        &:after {
            right: 0;
            left: 50%;
            border-left-color: transparent;
            border-width: 0 0 1em 1em;
        }
    `}
`;

export const View: React.StatelessComponent<{
    dispatch: Dispatch<Msg>;
    model: Model;
}> = ({ dispatch, model }) => {
    const from = getCurrencyOfChanger(Changers.FROM, model);
    const to = getCurrencyOfChanger(Changers.TO, model);
    const exchangeResult = getExchangeResult(from, to, model.amount);

    return (
        <Root noValidate onSubmit={event => {
            exchangeResult.cata({
                Nothing: () => {
                    // do nothing
                },
                Just: result => dispatch(Exchange(result.from, result.amountFrom, result.to, result.amountTo))
            });

            event.preventDefault();
        }}>
            <Header>
                <MenuItemContainer align="flex-start">
                    <MenuButton
                        type="button"
                        disabled
                    >Back</MenuButton>
                </MenuItemContainer>

                <MenuItemContainer align="center">
                    {Maybe.props({ from, to }).cata({
                        Nothing: () => null,
                        Just: acc => <CurrencySelector.View from={acc.from} to={acc.to} />
                    })}
                </MenuItemContainer>

                <MenuItemContainer align="flex-end">
                    <MenuButton
                        type="submit"
                        disabled={exchangeResult.isNothing()}
                    >Exchange</MenuButton>
                </MenuItemContainer>
            </Header>

            <Content>
                <ChangerContainer source={Changers.FROM}>
                    <Changer.View
                        amount={extractFormatedAmountFor(Changers.FROM, from, to, model.amount)}
                        currencies={model.currencies.filter(
                            currency => currency.code !== model.changers[ Changers.TO ].currency
                        )}
                        donor={Nothing}
                        model={model.changers.from}
                        dispatch={changerMsg => dispatch(ChangerMsg(Changers.FROM, changerMsg))}
                        autoFocus
                    />
                </ChangerContainer>

                <ChangerContainer source={Changers.TO}>
                    <Changer.View
                        amount={extractFormatedAmountFor(Changers.TO, from, to, model.amount)}
                        currencies={model.currencies.filter(
                            currency => currency.code !== model.changers[ Changers.FROM ].currency
                        )}
                        donor={from}
                        model={model.changers.to}
                        dispatch={changerMsg => dispatch(ChangerMsg(Changers.TO, changerMsg))}
                    />
                </ChangerContainer>
            </Content>
        </Root>
    );
};
