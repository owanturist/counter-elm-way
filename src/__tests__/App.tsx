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

const USD = Currency.of('USD', '$', 10.35);
const EUR = Currency.of('EUR', '€', 20.51);
const RUB = Currency.of('RUB', '₽', 30.87);


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
                [ EUR.code, 0.927238 ],
                [ RUB.code, 70.123471 ]
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

describe('App.getChangersRoles()', () => {
    describe('Amount is empty string', () => {
        test('TOP is active', () => {
            expect(App.getChangersRoles({
                cancelRequest: Nothing,
                currencies: [ USD, EUR, RUB ],
                active: App.Changers.TOP,
                amount: '',
                changers: {
                    [ App.Changers.TOP ]: Changer.init(USD.code),
                    [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
                }
            })).toEqual([ Changer.init(EUR.code), Changer.init(USD.code) ]);
        });

        test('BOTTOM is active', () => {
            expect(App.getChangersRoles({
                cancelRequest: Nothing,
                currencies: [ USD, EUR, RUB ],
                active: App.Changers.BOTTOM,
                amount: '',
                changers: {
                    [ App.Changers.TOP ]: Changer.init(USD.code),
                    [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
                }
            })).toEqual([ Changer.init(USD.code), Changer.init(EUR.code) ]);
        });
    });

    describe('Amount is zero', () => {
        test('TOP is active', () => {
            expect(App.getChangersRoles({
                cancelRequest: Nothing,
                currencies: [ USD, EUR, RUB ],
                active: App.Changers.TOP,
                amount: '0',
                changers: {
                    [ App.Changers.TOP ]: Changer.init(USD.code),
                    [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
                }
            })).toEqual([ Changer.init(EUR.code), Changer.init(USD.code) ]);
        });

        test('BOTTOM is active', () => {
            expect(App.getChangersRoles({
                cancelRequest: Nothing,
                currencies: [ USD, EUR, RUB ],
                active: App.Changers.BOTTOM,
                amount: '0',
                changers: {
                    [ App.Changers.TOP ]: Changer.init(USD.code),
                    [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
                }
            })).toEqual([ Changer.init(USD.code), Changer.init(EUR.code) ]);
        });
    });

    describe('Amount is more than zero', () => {
        test('TOP is active', () => {
            expect(App.getChangersRoles({
                cancelRequest: Nothing,
                currencies: [ USD, EUR, RUB ],
                active: App.Changers.TOP,
                amount: '5',
                changers: {
                    [ App.Changers.TOP ]: Changer.init(USD.code),
                    [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
                }
            })).toEqual([ Changer.init(EUR.code), Changer.init(USD.code) ]);
        });

        test('BOTTOM is active', () => {
            expect(App.getChangersRoles({
                cancelRequest: Nothing,
                currencies: [ USD, EUR, RUB ],
                active: App.Changers.BOTTOM,
                amount: '5',
                changers: {
                    [ App.Changers.TOP ]: Changer.init(USD.code),
                    [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
                }
            })).toEqual([ Changer.init(USD.code), Changer.init(EUR.code) ]);
        });
    });

    describe('Amount is less than zero', () => {
        test('TOP is active', () => {
            expect(App.getChangersRoles({
                cancelRequest: Nothing,
                currencies: [ USD, EUR, RUB ],
                active: App.Changers.TOP,
                amount: '-5',
                changers: {
                    [ App.Changers.TOP ]: Changer.init(USD.code),
                    [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
                }
            })).toEqual([ Changer.init(USD.code), Changer.init(EUR.code) ]);
        });

        test('BOTTOM is active', () => {
            expect(App.getChangersRoles({
                cancelRequest: Nothing,
                currencies: [ USD, EUR, RUB ],
                active: App.Changers.BOTTOM,
                amount: '-5',
                changers: {
                    [ App.Changers.TOP ]: Changer.init(USD.code),
                    [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
                }
            })).toEqual([ Changer.init(EUR.code), Changer.init(USD.code) ]);
        });
    });
});

describe('App.limit()', () => {
    test('amount is not number', () => {
        const model: App.Model = {
            cancelRequest: Nothing,
            currencies: [ USD, EUR, RUB ],
            active: App.Changers.TOP,
            amount: '',
            changers: {
                [ App.Changers.TOP ]: Changer.init(USD.code),
                [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
            }
        };

        expect(App.limit(model)).toBe(model);
    });

    test('from currency does not exist', () => {
        const model: App.Model = {
            cancelRequest: Nothing,
            currencies: [ USD, RUB ],
            active: App.Changers.TOP,
            amount: '5',
            changers: {
                [ App.Changers.TOP ]: Changer.init(USD.code),
                [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
            }
        };

        expect(App.limit(model)).toBe(model);
    });

    test('amount less than from', () => {
        const model: App.Model = {
            cancelRequest: Nothing,
            currencies: [ USD, EUR, RUB ],
            active: App.Changers.TOP,
            amount: '-11',
            changers: {
                [ App.Changers.TOP ]: Changer.init(USD.code),
                [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
            }
        };

        expect(App.limit(model)).toEqual({
            ...model,
            amount: '-10.35'
        });
    });

    test('pair rate does not exist', () => {
        const model: App.Model = {
            cancelRequest: Nothing,
            currencies: [ USD, EUR, RUB ],
            active: App.Changers.TOP,
            amount: '5',
            changers: {
                [ App.Changers.TOP ]: Changer.init(USD.code),
                [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
            }
        };

        expect(App.limit(model)).toBe(model);
    });

    test('pair rate exists', () => {
        const USD_ = USD.registerRates([
            [ EUR.code, 0.927238 ]
        ]);
        const model: App.Model = {
            cancelRequest: Nothing,
            currencies: [ USD_, EUR, RUB ],
            active: App.Changers.TOP,
            amount: '5',
            changers: {
                [ App.Changers.TOP ]: Changer.init(USD_.code),
                [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
            }
        };

        expect(App.limit(model)).toBe(model);
    });

    test('pair rate exists but amount more than from', () => {
        const EUR_ = EUR.registerRates([
            [ USD.code, 1.078471 ]
        ]);
        const model: App.Model = {
            cancelRequest: Nothing,
            currencies: [ USD, EUR_, RUB ],
            active: App.Changers.TOP,
            amount: '23',
            changers: {
                [ App.Changers.TOP ]: Changer.init(USD.code),
                [ App.Changers.BOTTOM ]: Changer.init(EUR_.code)
            }
        };

        expect(App.limit(model)).toEqual({
            ...model,
            amount: '22.11'
        });
    });
});

describe('App.extractFormatedAmountFor()', () => {
    test('source is active', () => {
        expect(App.extractFormatedAmountFor(App.Changers.TOP, {
                cancelRequest: Nothing,
                currencies: [ USD, EUR, RUB ],
                active: App.Changers.TOP,
                amount: '5',
                changers: {
                    [ App.Changers.TOP ]: Changer.init(USD.code),
                    [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
                }
            }
        )).toBe('5');
    });

    test('amount is not number', () => {
        expect(App.extractFormatedAmountFor(App.Changers.BOTTOM, {
                cancelRequest: Nothing,
                currencies: [ USD, EUR, RUB ],
                active: App.Changers.TOP,
                amount: '-',
                changers: {
                    [ App.Changers.TOP ]: Changer.init(USD.code),
                    [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
                }
            }
        )).toBe('');
    });

    test('from currency does not exist', () => {
        expect(App.extractFormatedAmountFor(App.Changers.BOTTOM, {
                cancelRequest: Nothing,
                currencies: [ USD, RUB ],
                active: App.Changers.TOP,
                amount: '5',
                changers: {
                    [ App.Changers.TOP ]: Changer.init(USD.code),
                    [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
                }
            }
        )).toBe('');
    });

    describe('from rate does not exist', () => {
        test('amount is zero', () => {
            expect(App.extractFormatedAmountFor(App.Changers.BOTTOM, {
                    cancelRequest: Nothing,
                    currencies: [ USD, EUR, RUB ],
                    active: App.Changers.TOP,
                    amount: '0',
                    changers: {
                        [ App.Changers.TOP ]: Changer.init(USD.code),
                        [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
                    }
                }
            )).toBe('0.00');
        });

        test('amount is more than zero', () => {
            expect(App.extractFormatedAmountFor(App.Changers.BOTTOM, {
                    cancelRequest: Nothing,
                    currencies: [ USD, EUR, RUB ],
                    active: App.Changers.TOP,
                    amount: '5',
                    changers: {
                        [ App.Changers.TOP ]: Changer.init(USD.code),
                        [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
                    }
                }
            )).toBe('');
        });

        test('amount is less than zero', () => {
            expect(App.extractFormatedAmountFor(App.Changers.BOTTOM, {
                    cancelRequest: Nothing,
                    currencies: [ USD, EUR, RUB ],
                    active: App.Changers.TOP,
                    amount: '-5',
                    changers: {
                        [ App.Changers.TOP ]: Changer.init(USD.code),
                        [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
                    }
                }
            )).toBe('');
        });
    });

    describe('from rate exists', () => {
        test('amount is more than zero', () => {
            const EUR_ = EUR.registerRates([
                [ USD.code, 1.078471 ]
            ]);

            expect(App.extractFormatedAmountFor(App.Changers.BOTTOM, {
                    cancelRequest: Nothing,
                    currencies: [ USD, EUR_, RUB ],
                    active: App.Changers.TOP,
                    amount: '4',
                    changers: {
                        [ App.Changers.TOP ]: Changer.init(USD.code),
                        [ App.Changers.BOTTOM ]: Changer.init(EUR_.code)
                    }
                }
            )).toBe('-3.71');
        });

        test('amount is less than zero', () => {
            const USD_ = USD.registerRates([
                [ EUR.code, 0.907238 ]
            ]);

            expect(App.extractFormatedAmountFor(App.Changers.BOTTOM, {
                    cancelRequest: Nothing,
                    currencies: [ USD_, EUR, RUB ],
                    active: App.Changers.TOP,
                    amount: '-4',
                    changers: {
                        [ App.Changers.TOP ]: Changer.init(USD_.code),
                        [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
                    }
                }
            )).toBe('3.62');
        });

        test('prevents making money', () => {
            const USD_ = USD.registerRates([
                [ EUR.code, 0.907238 ]
            ]);

            expect(App.extractFormatedAmountFor(App.Changers.BOTTOM, {
                    cancelRequest: Nothing,
                    currencies: [ USD_, EUR, RUB ],
                    active: App.Changers.TOP,
                    amount: '-0.01',
                    changers: {
                        [ App.Changers.TOP ]: Changer.init(USD_.code),
                        [ App.Changers.BOTTOM ]: Changer.init(EUR.code)
                    }
                }
            )).toBe('0.00');
        });
    });
});
