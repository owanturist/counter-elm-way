// import * as React from 'react';
// import {
//     shallow
// } from 'enzyme';

const Changer$init = jest.fn();
const Changer$isSame = jest.fn();
const Changer$update = jest.fn();

jest.mock('../Changer', () => ({
    init: Changer$init,
    isSame: Changer$isSame,
    update: Changer$update
}));

import {
    Nothing, Just
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

beforeAll(() => {
    Changer$init.mockImplementation((code: string) => ({ code }));
});

afterEach(() => {
    Changer$init.mockClear();
});

test('App.init()', () => {
    const [ initialModel ] = App.init([ USD, EUR, RUB ], USD.code, EUR.code);

    expect(initialModel).toMatchObject({
        currencies: [ USD, EUR, RUB ],
        amount: {
            source: App.Changers.FROM,
            value: Nothing
        },
        changers: {
            from: { code: USD.code },
            to: { code: EUR.code }
        }
    });
});

describe('App.update()', () => {
    test('NOOP', () => {
        const [ initialModel ] = App.init([ USD, EUR, RUB ], USD.code, EUR.code);
        const [ model ] = App.update({ type: 'NOOP' }, initialModel);

        expect(model).toBe(initialModel);
    });

    test('FETCH_RATES', () => {
        const initialModel: App.Model = {
            cancelRequest: Nothing,
            currencies: [ USD, EUR, RUB ],
            amount: {
                source: App.Changers.FROM,
                value: Nothing
            },
            changers: {
                from: Changer.init(USD.code),
                to: Changer.init(EUR.code)
            }
        };
        const [ model ] = App.update({ type: 'FETCH_RATES' }, initialModel);

        expect(model.cancelRequest.isJust()).toBe(true);
    });

    describe('FETCH_RATES_DONE', () => {
        const [ initialModel ] = App.init([ USD, EUR, RUB ], USD.code, EUR.code);

        test('request is failed', () => {
            const [ model ] = App.update({
                type: 'FETCH_RATES_DONE',
                base: USD.code,
                result: Left(Http.Error.NetworkError)
            }, initialModel);

            expect(model).toEqual({
                ...initialModel,
                cancelRequest: Nothing
            });
        });

        test('request is succeed', () => {
            const [ model ] = App.update({
                type: 'FETCH_RATES_DONE',
                base: USD.code,
                result: Right<Array<[ string, number ]>>([
                    [ 'EUR', 1.2 ],
                    [ 'RUB', 0.015 ]
                ])
            }, initialModel);

            expect(model).toEqual({
                ...initialModel,
                cancelRequest: Nothing,
                currencies: [
                    USD.registerRates([
                        [ 'EUR', 1.2 ],
                        [ 'RUB', 0.015 ]
                    ]),
                    EUR,
                    RUB
                ]
            });
        });
    });

    describe('CHANGER_MSG', () => {
        afterEach(() => {
            Changer$update.mockReset();
            Changer$isSame.mockReset();
        });

        describe('Changer.UPDATED', () => {
            test('currency has not been changed', () => {
                Changer$update.mockReturnValueOnce({
                    type: 'UPDATED',
                    currencyChanged: false,
                    model: 'next_FROM_Changer'
                });

                const [ initialModel ] = App.init([ USD, EUR, RUB ], USD.code, EUR.code);
                const [ model ] = App.update({
                    type: 'CHANGER_MSG',
                    source: App.Changers.FROM,
                    changerMsg: { type: 'SLIDE_END' }
                }, initialModel);

                expect(model).toEqual({
                    ...initialModel,
                    changers: {
                        ...model.changers,
                        from: 'next_FROM_Changer'
                    }
                });
                expect(Changer$update.mock.calls[ 0 ]).toEqual([
                    { type: 'SLIDE_END' },
                    initialModel.changers.from
                ]);
            });

            test('Changers have same currency', () => {
                Changer$update.mockReturnValueOnce({
                    type: 'UPDATED',
                    currencyChanged: true,
                    model: 'next_FROM_Changer'
                });
                Changer$isSame.mockReturnValueOnce(true);

                const [ initialModel ] = App.init([ USD, EUR, RUB ], USD.code, EUR.code);
                const [ model ] = App.update({
                    type: 'CHANGER_MSG',
                    source: App.Changers.FROM,
                    changerMsg: { type: 'SLIDE_END' }
                }, initialModel);

                expect(model).toEqual({
                    ...initialModel,
                    changers: {
                        ...model.changers,
                        from: 'next_FROM_Changer'
                    }
                });
                expect(Changer$update.mock.calls[ 0 ]).toEqual([
                    { type: 'SLIDE_END' },
                    initialModel.changers.from
                ]);
                expect(Changer$isSame.mock.calls[ 0 ]).toEqual([
                    'next_FROM_Changer',
                    initialModel.changers.to
                ]);
            });

            test('Changers have different currency', () => {
                Changer$update.mockReturnValueOnce({
                    type: 'UPDATED',
                    currencyChanged: true,
                    model: 'next_FROM_Changer'
                });
                Changer$isSame.mockReturnValueOnce(false);

                const initialModel: App.Model = {
                    cancelRequest: Nothing,
                    currencies: [ USD, EUR, RUB ],
                    amount: {
                        source: App.Changers.FROM,
                        value: Nothing
                    },
                    changers: {
                        from: Changer.init(USD.code),
                        to: Changer.init(EUR.code)
                    }
                };
                const [ model ] = App.update({
                    type: 'CHANGER_MSG',
                    source: App.Changers.FROM,
                    changerMsg: { type: 'SLIDE_END' }
                }, initialModel);

                expect(model).toMatchObject({
                    currencies: initialModel.currencies,
                    amount: initialModel.amount,
                    changers: {
                        ...model.changers,
                        from: 'next_FROM_Changer'
                    }
                });
                expect(model.cancelRequest.isJust()).toBe(true);
                expect(Changer$update.mock.calls[ 0 ]).toEqual([
                    { type: 'SLIDE_END' },
                    initialModel.changers.from
                ]);
                expect(Changer$isSame.mock.calls[ 0 ]).toEqual([
                    'next_FROM_Changer',
                    initialModel.changers.to
                ]);
            });
        });

        describe('Changer.AMOUNT_CHANGED', () => {
            test('to Nothing from Just', () => {
                Changer$update.mockReturnValueOnce({
                    type: 'AMOUNT_CHANGED',
                    amount: Nothing
                });
                Changer$isSame.mockReturnValueOnce(false);

                const initialModel: App.Model = {
                    cancelRequest: Nothing,
                    currencies: [ USD, EUR, RUB ],
                    amount: {
                        source: App.Changers.FROM,
                        value: Just('100')
                    },
                    changers: {
                        from: Changer.init(USD.code),
                        to: Changer.init(EUR.code)
                    }
                };
                const [ model ] = App.update({
                    type: 'CHANGER_MSG',
                    source: App.Changers.TO,
                    changerMsg: { type: 'SLIDE_END' }
                }, initialModel);

                expect(model).toEqual({
                    ...initialModel,
                    amount: {
                        source: App.Changers.TO,
                        value: Nothing
                    }
                });
                expect(Changer$update.mock.calls[ 0 ]).toEqual([
                    { type: 'SLIDE_END' },
                    initialModel.changers.to
                ]);
            });

            test('to Just from Nothing', () => {
                Changer$update.mockReturnValueOnce({
                    type: 'AMOUNT_CHANGED',
                    amount: Just('100')
                });
                Changer$isSame.mockReturnValueOnce(false);

                const initialModel: App.Model = {
                    cancelRequest: Nothing,
                    currencies: [ USD, EUR, RUB ],
                    amount: {
                        source: App.Changers.FROM,
                        value: Nothing
                    },
                    changers: {
                        from: Changer.init(USD.code),
                        to: Changer.init(EUR.code)
                    }
                };
                const [ model ] = App.update({
                    type: 'CHANGER_MSG',
                    source: App.Changers.TO,
                    changerMsg: { type: 'SLIDE_END' }
                }, initialModel);

                expect(model).toEqual({
                    ...initialModel,
                    amount: {
                        source: App.Changers.TO,
                        value: Just('100')
                    }
                });
                expect(Changer$update.mock.calls[ 0 ]).toEqual([
                    { type: 'SLIDE_END' },
                    initialModel.changers.to
                ]);
            });
        });
    });
});
