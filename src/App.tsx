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
import * as Utils from './Utils';

/**
 * M O D E L
 */

export enum Changers {
    TOP,
    BOTTOM
}

export type Model = Readonly<{
    cancelRequest: Maybe<Cmd<Msg>>;
    currencies: Array<Currency>;
    active: Changers;
    amount: string;
    changers: {
        [ Key in Changers ]: Changer.Model
    };
}>;

export const init = (to: Currency, from: Currency, currencies: Array<Currency>): [ Model, Cmd<Msg> ] => {
    const [ cancelRequestCmd, fetchRatesCmd ] = fetchRates(from.code, to.code);

    return [
        {
            cancelRequest: Just(cancelRequestCmd),
            currencies: [ to, from, ...currencies ],
            active: Changers.TOP,
            amount: '',
            changers: {
                [ Changers.TOP ]: Changer.init(to.code),
                [ Changers.BOTTOM ]: Changer.init(from.code)
            }
        },
        fetchRatesCmd
    ];
};


const getChangersRoles = (model: Model): [ Changer.Model, Changer.Model ] => {
    if (Utils.stringToNumber(model.amount).getOrElse(0) >= 0) {
        return model.active === Changers.TOP
            ? [ model.changers[ Changers.BOTTOM ], model.changers[ Changers.TOP ] ]
            : [ model.changers[ Changers.TOP ], model.changers[ Changers.BOTTOM ] ];
    }

    return model.active === Changers.TOP
        ? [ model.changers[ Changers.TOP ], model.changers[ Changers.BOTTOM ] ]
        : [ model.changers[ Changers.BOTTOM ], model.changers[ Changers.TOP ] ];
};

const getCurrencyOfChanger = (changer: Changer.Model, model: Model): Maybe<Currency> => {
    return Utils.find(
        currency => Changer.getCurrencyCode(changer).isEqual(currency.code),
        model.currencies
    );
};

const limit = (model: Model): Model => Utils.stringToNumber(model.amount).chain(amount => {
    const [ from, to ] = getChangersRoles(model);

    return getCurrencyOfChanger(from, model)
        .chain(currencyFrom => {
            const minimum = Utils.floor(2, -currencyFrom.amount);

            if (amount < minimum) {
                return Just({
                    ...model,
                    amount: minimum.toFixed(2)
                });
            }

            return currencyFrom.convertFrom(currencyFrom.amount, Changer.getCurrencyCode(to)).chain(max => {
                const maximum = Utils.floor(2, max);

                return amount > maximum ? Just({
                    ...model,
                    amount: maximum.toFixed(2)
                }) : Nothing;
            });
        });
}).getOrElse(model);

/**
 * U P D A T E
 */

export type Msg
    = { type: 'NOOP' }
    | { type: 'FETCH_RATES' }
    | { type: 'FETCH_RATES_DONE'; from: Currency.ID; result: Either<Http.Error, Currency.Rates> }
    | { type: 'EXCHANGE'; amountFrom: number; amountTo: number }
    | { type: 'CHANGER_MSG'; source: Changers; changerMsg: Changer.Msg }
    ;

const NoOp: Msg = { type: 'NOOP' };
const FetchRates: Msg = { type: 'FETCH_RATES' };
const FetchRatesDone = (
    from: Currency.ID,
    result: Either<Http.Error, Currency.Rates>
): Msg => ({ type: 'FETCH_RATES_DONE', from, result });
const Exchange = (amountFrom: number, amountTo: number): Msg => ({ type: 'EXCHANGE', amountFrom, amountTo });
const ChangerMsg = (source: Changers, changerMsg: Changer.Msg): Msg => ({ type: 'CHANGER_MSG', source, changerMsg });

const fetchRates = (from: Currency.ID, to: Currency.ID): [ Cmd<Msg>, Cmd<Msg> ] => {
    const [ cancel, request ] = Api.getRatesFor(from, to, []).toCancelableTask();

    return [
        cancel.perform(() => NoOp),
        request.attempt(result => FetchRatesDone(from, result))
    ];
};

export const update = (msg: Msg, model: Model): [ Model, Cmd<Msg> ] => {
    switch (msg.type) {
        case 'NOOP': {
            return [ model, Cmd.none ];
        }

        case 'FETCH_RATES': {
            const [ from, to ] = getChangersRoles(model);
            const [ cancelRequestCmd, fetchRatesCmd ] = fetchRates(
                Changer.getCurrencyCode(from),
                Changer.getCurrencyCode(to)
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

                    Right: rates => limit({
                        ...model,
                        cancelRequest: Nothing,
                        currencies: model.currencies.map(currency => currency.code.isEqual(msg.from)
                            ? currency.registerRates(rates)
                            : currency
                        )
                    })
                }),
                Cmd.none
            ];
        }

        case 'EXCHANGE': {
            const [ from, to ] = getChangersRoles(model);

            const nextCurrencies = model.currencies.map(currency => {
                if (Changer.getCurrencyCode(from).isEqual(currency.code)) {
                    return currency.change(msg.amountFrom);
                }

                if (Changer.getCurrencyCode(to).isEqual(currency.code)) {
                    return currency.change(msg.amountTo);
                }

                return currency;
            });

            return [
                {
                    ...model,
                    currencies: nextCurrencies,
                    amount: ''
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
                        ...model,
                        changers: {
                            ...model.changers,
                            [ msg.source ]: stage.model
                        }
                    });

                    const [ from, to ] = getChangersRoles(nextModel);
                    const [ cancelRequestCmd, fetchRatesCmd ] = fetchRates(
                        Changer.getCurrencyCode(from),
                        Changer.getCurrencyCode(to)
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
                    const nextModel = limit({
                        ...model,
                        active: msg.source,
                        amount: stage.amount
                    });

                    const [ from, to ] = getChangersRoles(model);
                    const [ nextFrom, nextTo ] = getChangersRoles(nextModel);

                    if (Changer.isSame(from, nextFrom) && Changer.isSame(to, nextTo)) {
                        return [ nextModel, Cmd.none ];
                    }

                    const [ cancelRequestCmd, fetchRatesCmd ] = fetchRates(
                        Changer.getCurrencyCode(nextFrom),
                        Changer.getCurrencyCode(nextTo)
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
    Changer.subscriptions(model.changers[ Changers.TOP ]).map(changerMsg => ChangerMsg(Changers.TOP, changerMsg)),
    Changer.subscriptions(model.changers[ Changers.BOTTOM ]).map(changerMsg => ChangerMsg(Changers.BOTTOM, changerMsg)),
    model.cancelRequest.cata({
        Nothing: () => Time.every(10000, () => FetchRates),
        Just: () => Sub.none
    })
]);

/**
 * V I E W
 */

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
    justify-content: flex-end;
    line-height: 1;
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
    position: Changers;
}>`
    flex: 1 0 50%;
    display: flex;
    position: relative;
    background: ${props => props.position === Changers.BOTTOM ? 'rgba(0, 0, 0, .25)' : null};
    ${props => props.position === Changers.TOP ? `
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

const extractFormatedAmountFor = (
    source: Changers,
    fromCurrency: Maybe<Currency>,
    toCurrencyCode: Currency.ID,
    model: Model
): string => {
    if (model.active === source) {
        return model.amount;
    }

    return Maybe.props({
        from: fromCurrency,
        amount: Utils.stringToNumber(model.amount)
    }).chain(acc => acc.amount >= 0
        ? acc.from.convertTo(-acc.amount, toCurrencyCode)
        : acc.from.convertFrom(-acc.amount, toCurrencyCode)
    ).map(
        amount => Utils.floor(2, amount).toFixed(2)
    ).getOrElse('');
};

const getExchangeResult = (
    fromCurrency: Maybe<Currency>,
    toCurrencyCode: Currency.ID,
    amount: string
): Maybe<{
    amountFrom: number;
    amountTo: number;
}> => {
    return Maybe.props({
        from: fromCurrency,
        amount: Utils.stringToNumber(amount)
    }).chain(acc => acc.amount >= 0
        ? acc.from.convertTo(-acc.amount, toCurrencyCode).map(amountFrom => [ amountFrom, acc.amount ])
        : acc.from.convertFrom(-acc.amount, toCurrencyCode).map(amountTo => [ acc.amount, amountTo ])
    ).map(
        ([ amountFrom, amountTo ]) => [ Utils.floor(2, amountFrom), Utils.floor(2, amountTo) ]
    ).chain(
        ([ amountFrom, amountTo ]) => amountFrom === 0 || amountTo === 0 ? Nothing : Just({ amountFrom, amountTo })
    );
};

export const View: React.StatelessComponent<{
    dispatch: Dispatch<Msg>;
    model: Model;
}> = ({ dispatch, model }) => {
    const [ changerFrom, changerTo ] = getChangersRoles(model);
    const changerTop = model.changers[ Changers.TOP ];
    const changerBottom = model.changers[ Changers.BOTTOM ];
    const changerToCurrency = Changer.getCurrencyCode(changerTo);
    const currencyFrom = getCurrencyOfChanger(changerFrom, model);
    const exchangeResult = getExchangeResult(currencyFrom, changerToCurrency, model.amount);

    return (
        <Root noValidate onSubmit={event => {
            dispatch(exchangeResult.cata({
                Nothing: () => NoOp,
                Just: ({ amountFrom, amountTo }) => Exchange(amountFrom, amountTo)
            }));

            event.preventDefault();
        }}>
            <Header>
                <MenuButton
                    type="submit"
                    disabled={exchangeResult.isNothing()}
                >Exchange</MenuButton>
            </Header>

            <Content>
                <ChangerContainer position={Changers.TOP}>
                    <Changer.View
                        amount={extractFormatedAmountFor(Changers.TOP, currencyFrom, changerToCurrency, model)}
                        currencies={model.currencies.filter(
                            currency => !Changer.getCurrencyCode(changerBottom).isEqual(currency.code)
                        )}
                        pair={getCurrencyOfChanger(changerBottom, model)}
                        model={changerTop}
                        dispatch={changerMsg => dispatch(ChangerMsg(Changers.TOP, changerMsg))}
                        autoFocus
                    />
                </ChangerContainer>

                <ChangerContainer position={Changers.BOTTOM}>
                    <Changer.View
                        amount={extractFormatedAmountFor(Changers.BOTTOM, currencyFrom, changerToCurrency, model)}
                        currencies={model.currencies.filter(
                            currency => !Changer.getCurrencyCode(changerTop).isEqual(currency.code)
                        )}
                        pair={getCurrencyOfChanger(changerTop, model)}
                        model={changerBottom}
                        dispatch={changerMsg => dispatch(ChangerMsg(Changers.BOTTOM, changerMsg))}
                    />
                </ChangerContainer>
            </Content>
        </Root>
    );
};
