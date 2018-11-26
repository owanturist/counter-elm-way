const Changer$init = jest.fn();
const Changer$update = jest.fn();

jest.mock('../Changer', () => ({
    init: Changer$init,
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
    Changer$init.mockImplementation((code: string) => `__${code}__`);
});

test('App.init()', () => {
    const [ initialModel ] = App.init([ USD, EUR, RUB ], USD.code, EUR.code);

    expect(initialModel).toMatchObject({
        currencies: [ USD, EUR, RUB ],
        amount: {
            source: App.Changers.TOP,
            value: Nothing
        },
        changers: {
            from: '__USD__',
            to: '__EUR__'
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
                source: App.Changers.TOP,
                value: Nothing
            },
            changers: {
                [ App.Changers.TOP ]: Changer.init(USD.code),
                [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
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
                    source: App.Changers.TOP,
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
                    initialModel.changers[ App.Changers.TOP ]
                ]);
            });

            test('currency has been changed', () => {
                Changer$update.mockReturnValueOnce({
                    type: 'UPDATED',
                    currencyChanged: true,
                    model: 'next_FROM_Changer'
                });

                const initialModel: App.Model = {
                    cancelRequest: Nothing,
                    currencies: [ USD, EUR, RUB ],
                    amount: {
                        source: App.Changers.TOP,
                        value: Nothing
                    },
                    changers: {
                        [ App.Changers.TOP ]: Changer.init(USD.code),
                        [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
                    }
                };
                const [ model ] = App.update({
                    type: 'CHANGER_MSG',
                    source: App.Changers.TOP,
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
                    initialModel.changers[ App.Changers.TOP ]
                ]);
            });
        });

        describe('Changer.AMOUNT_CHANGED', () => {
            test('to Nothing from Just', () => {
                Changer$update.mockReturnValueOnce({
                    type: 'AMOUNT_CHANGED',
                    amount: Nothing
                });

                const initialModel: App.Model = {
                    cancelRequest: Nothing,
                    currencies: [ USD, EUR, RUB ],
                    amount: {
                        source: App.Changers.TOP,
                        value: Just('100')
                    },
                    changers: {
                        [ App.Changers.TOP ]: Changer.init(USD.code),
                        [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
                    }
                };
                const [ model ] = App.update({
                    type: 'CHANGER_MSG',
                    source: App.Changers.BOTTOM,
                    changerMsg: { type: 'SLIDE_END' }
                }, initialModel);

                expect(model).toEqual({
                    ...initialModel,
                    amount: {
                        source: App.Changers.BOTTOM,
                        value: Nothing
                    }
                });
                expect(Changer$update.mock.calls[ 0 ]).toEqual([
                    { type: 'SLIDE_END' },
                    initialModel.changers[ App.Changers.BOTTOM ]
                ]);
            });

            test('to Just from Nothing', () => {
                Changer$update.mockReturnValueOnce({
                    type: 'AMOUNT_CHANGED',
                    amount: Just('100')
                });

                const initialModel: App.Model = {
                    cancelRequest: Nothing,
                    currencies: [ USD, EUR, RUB ],
                    amount: {
                        source: App.Changers.TOP,
                        value: Nothing
                    },
                    changers: {
                        [ App.Changers.TOP ]: Changer.init(USD.code),
                        [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
                    }
                };
                const [ model ] = App.update({
                    type: 'CHANGER_MSG',
                    source: App.Changers.BOTTOM,
                    changerMsg: { type: 'SLIDE_END' }
                }, initialModel);

                expect(model).toEqual({
                    ...initialModel,
                    amount: {
                        source: App.Changers.BOTTOM,
                        value: Just('100')
                    }
                });
                expect(Changer$update.mock.calls[ 0 ]).toEqual([
                    { type: 'SLIDE_END' },
                    initialModel.changers[ App.Changers.BOTTOM ]
                ]);
            });
        });
    });
});
