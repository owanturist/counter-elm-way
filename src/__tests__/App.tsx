import {
    Nothing
} from 'Fractal/Maybe';
import {
    Left,
    Right
} from 'Fractal/Either';
import * as Http from 'Fractal/Http';

import {
    Currency
} from '../Currency';
import * as App from '../App';
import * as Changer from '../Changer';

const USD = Currency.of('USD', '$', 10);
const EUR = Currency.of('EUR', '€', 20);
const RUB = Currency.of('RUB', '₽', 30);


test('App.init()', () => {
    const [ initialModel ] = App.init(USD, EUR, [ RUB ]);

    expect(initialModel).toMatchObject({
        currencies: [ USD, EUR, RUB ],
        active: App.Changers.TOP,
        amount: '',
        changers: {
            [ App.Changers.TOP ]: Changer.init(USD.code),
            [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
        }
    });
});

describe('App.update()', () => {
    test('NOOP', () => {
        const [ initialModel ] = App.init(USD, EUR, [ RUB ]);
        const [ model ] = App.update({ type: 'NOOP' }, initialModel);

        expect(model).toBe(initialModel);
    });

    test('FETCH_RATES', () => {
        const initialModel: App.Model = {
            cancelRequest: Nothing,
            currencies: [ USD, EUR, RUB ],
            active: App.Changers.TOP,
            amount: '',
            changers: {
                [ App.Changers.TOP ]: Changer.init(USD.code),
                [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
            }
        };
        const [ model ] = App.update({ type: 'FETCH_RATES' }, initialModel);

        expect(model.cancelRequest.isJust()).toBe(true);
    });

    describe('FETCH_RATES_DONE', () => {
        const [ initialModel ] = App.init(USD, EUR, [ RUB ]);

        test('request is failed', () => {
            const [ model ] = App.update({
                type: 'FETCH_RATES_DONE',
                from: USD.code,
                result: Left(Http.Error.NetworkError)
            }, initialModel);

            expect(model).toEqual({
                ...initialModel,
                cancelRequest: Nothing
            });
        });

        test('request is succeed', () => {
            const rates: Currency.Rates = [
                [ EUR.code, 1.2 ],
                [ RUB.code, 0.015 ]
            ];
            const [ model ] = App.update({
                type: 'FETCH_RATES_DONE',
                from: USD.code,
                result: Right(rates)
            }, initialModel);

            expect(model).toEqual({
                ...initialModel,
                cancelRequest: Nothing,
                currencies: [
                    USD.registerRates(rates),
                    EUR,
                    RUB
                ]
            });
        });
    });

    test('EXCHANGE', () => {
        const [ initialModel ] = App.init(USD, EUR, [ RUB ]);
        const [ model ] = App.update({
            type: 'EXCHANGE',
            amountFrom: -5,
            amountTo: 6
        }, initialModel);

        expect(model).toEqual({
            ...initialModel,
            currencies: [
                USD.change(6),
                EUR.change(-5),
                RUB
            ],
            amount: ''
        });
    });

    describe('CHANGER_MSG', () => {
        describe('Changer.UPDATED', () => {
            test('currency has not been changed', () => {
                const [ initialModel ] = App.init(USD, EUR, [ RUB ]);
                const [ model ] = App.update({
                    type: 'CHANGER_MSG',
                    source: App.Changers.TOP,
                    changerMsg: { type: 'SLIDE_END' }
                }, initialModel);

                expect(model).toEqual({
                    ...initialModel,
                    changers: {
                        ...model.changers,
                        [ App.Changers.TOP ]: {
                            currency: USD.code,
                            dragging: Nothing,
                            sliding: Nothing
                        }
                    }
                });
            });

            test('currency has been changed', () => {
                const initialModel: App.Model = {
                    cancelRequest: Nothing,
                    currencies: [ USD, EUR, RUB ],
                    active: App.Changers.TOP,
                    amount: '',
                    changers: {
                        [ App.Changers.TOP ]: Changer.init(USD.code),
                        [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
                    }
                };
                const [ model ] = App.update({
                    type: 'CHANGER_MSG',
                    source: App.Changers.TOP,
                    changerMsg: { type: 'CHANGE_CURRENCY', currency: RUB.code }
                }, initialModel);

                expect(model).toMatchObject({
                    currencies: initialModel.currencies,
                    active: initialModel.active,
                    amount: initialModel.amount,
                    changers: {
                        ...model.changers,
                        [ App.Changers.TOP ]: {
                            currency: RUB.code,
                            dragging: Nothing,
                            sliding: Nothing
                        }
                    }
                });
                expect(model.cancelRequest.isJust()).toBe(true);
            });
        });

        describe('Changer.AMOUNT_CHANGED', () => {
            test('source and sign of amount have not been changed', () => {
                const initialModel: App.Model = {
                    cancelRequest: Nothing,
                    currencies: [ USD, EUR, RUB ],
                    active: App.Changers.TOP,
                    amount: '5',
                    changers: {
                        [ App.Changers.TOP ]: Changer.init(USD.code),
                        [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
                    }
                };
                const [ model ] = App.update({
                    type: 'CHANGER_MSG',
                    source: App.Changers.TOP,
                    changerMsg: { type: 'CHANGE_AMOUNT', amount: '6' }
                }, initialModel);

                expect(model).toEqual({
                    ...initialModel,
                    amount: '6'
                });
            });

            test('source and sign of amount have been changed', () => {
                const initialModel: App.Model = {
                    cancelRequest: Nothing,
                    currencies: [ USD, EUR, RUB ],
                    active: App.Changers.TOP,
                    amount: '5',
                    changers: {
                        [ App.Changers.TOP ]: Changer.init(USD.code),
                        [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
                    }
                };
                const [ model ] = App.update({
                    type: 'CHANGER_MSG',
                    source: App.Changers.BOTTOM,
                    changerMsg: { type: 'CHANGE_AMOUNT', amount: '-6' }
                }, initialModel);

                expect(model).toEqual({
                    ...initialModel,
                    active: App.Changers.BOTTOM,
                    amount: '-6'
                });
            });

            test('source has not been changed but sign has been changed', () => {
                const initialModel: App.Model = {
                    cancelRequest: Nothing,
                    currencies: [ USD, EUR, RUB ],
                    active: App.Changers.TOP,
                    amount: '5',
                    changers: {
                        [ App.Changers.TOP ]: Changer.init(USD.code),
                        [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
                    }
                };
                const [ model ] = App.update({
                    type: 'CHANGER_MSG',
                    source: App.Changers.TOP,
                    changerMsg: { type: 'CHANGE_AMOUNT', amount: '-6' }
                }, initialModel);

                expect(model).toMatchObject({
                    currencies: model.currencies,
                    active: model.active,
                    amount: '-6',
                    changers: model.changers
                });
                expect(model.cancelRequest.isJust()).toBe(true);
            });

            test('source has been changed but sign has not been changed', () => {
                const initialModel: App.Model = {
                    cancelRequest: Nothing,
                    currencies: [ USD, EUR, RUB ],
                    active: App.Changers.TOP,
                    amount: '5',
                    changers: {
                        [ App.Changers.TOP ]: Changer.init(USD.code),
                        [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
                    }
                };
                const [ model ] = App.update({
                    type: 'CHANGER_MSG',
                    source: App.Changers.BOTTOM,
                    changerMsg: { type: 'CHANGE_AMOUNT', amount: '6' }
                }, initialModel);

                expect(model).toMatchObject({
                    currencies: model.currencies,
                    active: App.Changers.BOTTOM,
                    amount: '6',
                    changers: model.changers
                });
                expect(model.cancelRequest.isJust()).toBe(true);
            });
        });
    });
});
