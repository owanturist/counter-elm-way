import * as React from 'react';
import {
    shallow
} from 'enzyme';

import {
    Nothing,
    Just
} from 'Fractal/Maybe';

import {
    Currency
} from '../Currency';
import * as Changer from '../Changer';

const RUB = Currency.of('RUB', '₽', 100);
const EUR = Currency.of('EUR', '€', 50);
const USD = Currency.of('USD', '$', 200);
const GBP = Currency.of('GBP', '£', 25);
const SEK = Currency.of('GBP', 'Kr', 150);

test('Changer.init()', () => {
    expect(Changer.init(RUB.code)).toEqual({
        currency: RUB.code,
        dragging: Nothing,
        sliding: Nothing
    });
});

describe('Changer.update()', () => {
    test('CHANGE_CURRENCY', () => {
        const initialModel = Changer.init(EUR.code);

        expect(
            Changer.update(
                { type: 'CHANGE_CURRENCY', currency: RUB.code},
                initialModel
            )
        ).toEqual({
            type: 'UPDATED',
            currencyChanged: true,
            model: { ...initialModel, currency: RUB.code }
        });
    });

    describe('CHANGE_AMOUNT', () => {
        test('empty amount', () => {
            expect(
                Changer.update(
                    { type: 'CHANGE_AMOUNT', amount: '' },
                    Changer.init(EUR.code)
                )
            ).toEqual({
                type: 'AMOUNT_CHANGED',
                amount: ''
            });
        });

        test('non empty amount', () => {
            expect(
                Changer.update(
                    { type: 'CHANGE_AMOUNT', amount: '20' },
                    Changer.init(EUR.code)
                )
            ).toEqual({
                type: 'AMOUNT_CHANGED',
                amount: '20'
            });
        });

    });

    test('DRAG_START', () => {
        const initialModel = Changer.init(EUR.code);

        expect(
            Changer.update(
                { type: 'DRAG_START', start: 100 },
                initialModel
            )
        ).toEqual({
            type: 'UPDATED',
            currencyChanged: false,
            model: {
                ...initialModel,
                dragging: Just({
                    ref: React.createRef(),
                    start: 100,
                    delta: Nothing
                })
            }
        });
    });

    describe('DRAG', () => {
        test('drag has not been started', () => {
            const initialModel = Changer.init(EUR.code);

            expect(
                Changer.update(
                    { type: 'DRAG', prev: Nothing, next: Nothing, end: 200, width: 800 },
                    initialModel
                )
            ).toEqual({
                type: 'UPDATED',
                currencyChanged: false,
                model: {
                    ...initialModel,
                    dragging: Nothing
                }
            });
        });

        test('dragging delta is less then luft', () => {
            const initialModel: Changer.Model = {
                currency: EUR.code,
                dragging: Just({
                    ref: React.createRef<HTMLDivElement>(),
                    start: 100,
                    delta: Nothing
                }),
                sliding: Nothing
            };

            expect(
                Changer.update(
                    { type: 'DRAG', prev: Nothing, next: Nothing, end: 110, width: 800 },
                    initialModel
                )
            ).toEqual({
                type: 'UPDATED',
                currencyChanged: false,
                model: initialModel
            });
        });

        test('dragging delta is more then luft', () => {
            const initialDragging = {
                ref: React.createRef<HTMLDivElement>(),
                start: 100,
                delta: Nothing
            };
            const initialModel: Changer.Model = {
                currency: EUR.code,
                dragging: Just(initialDragging),
                sliding: Nothing
            };

            expect(
                Changer.update(
                    { type: 'DRAG', prev: Nothing, next: Nothing, end: 130, width: 800 },
                    initialModel
                )
            ).toEqual({
                type: 'UPDATED',
                currencyChanged: false,
                model: {
                    ...initialModel,
                    dragging: Just({
                        ...initialDragging,
                        delta: Just(10)
                    })
                }
            });
        });

        test('dragging delta is less then third of width without next Currency', () => {
            const initialModel: Changer.Model = {
                currency: EUR.code,
                dragging: Just({
                    ref: React.createRef<HTMLDivElement>(),
                    start: 100,
                    delta: Nothing
                }),
                sliding: Nothing
            };

            expect(
                Changer.update(
                    { type: 'DRAG', prev: Nothing, next: Nothing, end: -200, width: 800 },
                    initialModel
                )
            ).toEqual({
                type: 'UPDATED',
                currencyChanged: false,
                model: {
                    ...initialModel,
                    dragging: Nothing,
                    sliding: Just({
                        currency: Nothing,
                        duration: 280,
                        destination: 0
                    })
                }
            });
        });

        test('dragging delta is more then third of width without prev Currency', () => {
            const initialModel: Changer.Model = {
                currency: EUR.code,
                dragging: Just({
                    ref: React.createRef<HTMLDivElement>(),
                    start: 100,
                    delta: Nothing
                }),
                sliding: Nothing
            };

            expect(
                Changer.update(
                    { type: 'DRAG', prev: Nothing, next: Nothing, end: 400, width: 800 },
                    initialModel
                )
            ).toEqual({
                type: 'UPDATED',
                currencyChanged: false,
                model: {
                    ...initialModel,
                    dragging: Nothing,
                    sliding: Just({
                        currency: Nothing,
                        duration: 280,
                        destination: 0
                    })
                }
            });
        });

        test('dragging delta is less then third of width next Currency', () => {
            const initialModel: Changer.Model = {
                currency: EUR.code,
                dragging: Just({
                    ref: React.createRef<HTMLDivElement>(),
                    start: 100,
                    delta: Nothing
                }),
                sliding: Nothing
            };

            expect(
                Changer.update(
                    { type: 'DRAG', prev: Nothing, next: Just(RUB.code), end: -200, width: 800 },
                    initialModel
                )
            ).toEqual({
                type: 'UPDATED',
                currencyChanged: true,
                model: {
                    currency: RUB.code,
                    dragging: Nothing,
                    sliding: Just({
                        currency: Just(EUR.code),
                        duration: 300,
                        destination: -800
                    })
                }
            });
        });

        test('dragging delta is more then third of width prev Currency', () => {
            const initialModel: Changer.Model = {
                currency: EUR.code,
                dragging: Just({
                    ref: React.createRef<HTMLDivElement>(),
                    start: 100,
                    delta: Nothing
                }),
                sliding: Nothing
            };

            expect(
                Changer.update(
                    { type: 'DRAG', prev: Just(RUB.code), next: Nothing, end: 400, width: 800 },
                    initialModel
                )
            ).toEqual({
                type: 'UPDATED',
                currencyChanged: true,
                model: {
                    currency: RUB.code,
                    dragging: Nothing,
                    sliding: Just({
                        currency: Just(EUR.code),
                        duration: 300,
                        destination: 800
                    })
                }
            });
        });
    });

    describe('DRAG_END', () => {
        test('drag has not been started', () => {
            const initialModel = Changer.init(EUR.code);

            expect(
                Changer.update(
                    { type: 'DRAG_END' },
                    initialModel
                )
            ).toEqual({
                type: 'UPDATED',
                currencyChanged: false,
                model: {
                    ...initialModel,
                    dragging: Nothing
                }
            });
        });

        test('dragging delta is nothing', () => {
            const initialModel: Changer.Model = {
                currency: EUR.code,
                dragging: Just({
                    ref: React.createRef<HTMLDivElement>(),
                    start: 100,
                    delta: Nothing
                }),
                sliding: Nothing
            };

            expect(
                Changer.update(
                    { type: 'DRAG_END' },
                    initialModel
                )
            ).toEqual({
                type: 'UPDATED',
                currencyChanged: false,
                model: {
                    ...initialModel,
                    dragging: Nothing
                }
            });
        });

        test('dragging delta is exists', () => {
            const initialModel: Changer.Model = {
                currency: EUR.code,
                dragging: Just({
                    ref: React.createRef<HTMLDivElement>(),
                    start: 100,
                    delta: Just(100)
                }),
                sliding: Nothing
            };

            expect(
                Changer.update(
                    { type: 'DRAG_END' },
                    initialModel
                )
            ).toEqual({
                type: 'UPDATED',
                currencyChanged: false,
                model: {
                    ...initialModel,
                    dragging: Nothing,
                    sliding: Just({
                        currency: Nothing,
                        duration: 100,
                        destination: 0
                    })
                }
            });
        });
    });

    test('SLIDE_END', () => {
        const initialModel = Changer.init(EUR.code);

        expect(
            Changer.update(
                { type: 'SLIDE_END' },
                initialModel
            )
        ).toEqual({
            type: 'UPDATED',
            currencyChanged: false,
            model: {
                ...initialModel,
                sliding: Nothing
            }
        });
    });
});

describe('Changer.View', () => {
    const dispatch = () => {
        // do nothing
    };
    const USD = Currency.of('USD', '$', 100);
    const EUR = Currency.of('EUR', '€', 200);
    const RUB = Currency.of('RUB', '₽', 300);

    test('no current currency', () => {
        const wrapper = shallow(
            <Changer.View
                dispatch={dispatch}
                model={Changer.init(RUB.code)}
                amount="100"
                currencies={[ Currency.of('USD', '$', 0) ]}
                pair={Nothing}
            />
        );

        expect(wrapper).toBeEmptyRender();
    });

    test('single currency', () => {
        const wrapper = shallow(
            <Changer.View
                dispatch={dispatch}
                model={Changer.init(USD.code)}
                amount="100"
                currencies={[ USD ]}
                pair={Nothing}
            />
        );

        expect(wrapper.find('Carousel')).toContainMatchingElements(1, 'Slide');

        expect(wrapper.find('Carousel').childAt(0)).toHaveProp('amount', '100');
        expect(wrapper.find('Carousel').childAt(0)).toHaveProp('currency', USD);
    });

    describe('two currencies', () => {
        test('first is current', () => {
            const wrapper = shallow(
                <Changer.View
                    dispatch={dispatch}
                    model={Changer.init(USD.code)}
                    amount="100"
                    currencies={[ USD, EUR ]}
                    pair={Nothing}
                />
            );

            expect(wrapper.find('Carousel')).toContainMatchingElements(2, 'Slide');

            expect(wrapper.find('Carousel').childAt(0)).toHaveProp('amount', '100');
            expect(wrapper.find('Carousel').childAt(0)).toHaveProp('currency', USD);

            expect(wrapper.find('Carousel').childAt(1)).toHaveProp('amount', '');
            expect(wrapper.find('Carousel').childAt(1)).toHaveProp('currency', EUR);

            expect(wrapper.find('Line')).toContainMatchingElements(2, 'Point');

            expect(wrapper.find('Line').childAt(0)).toHaveProp('active', true);
        });

        test('second is current', () => {
            const wrapper = shallow(
                <Changer.View
                    dispatch={dispatch}
                    model={Changer.init(EUR.code)}
                    amount="100"
                    currencies={[ USD, EUR ]}
                    pair={Nothing}
                />
            );

            expect(wrapper.find('Carousel')).toContainMatchingElements(2, 'Slide');

            expect(wrapper.find('Carousel').childAt(0)).toHaveProp('amount', '');
            expect(wrapper.find('Carousel').childAt(0)).toHaveProp('currency', USD);

            expect(wrapper.find('Carousel').childAt(1)).toHaveProp('amount', '100');
            expect(wrapper.find('Carousel').childAt(1)).toHaveProp('currency', EUR);

            expect(wrapper.find('Line')).toContainMatchingElements(2, 'Point');

            expect(wrapper.find('Line').childAt(1)).toHaveProp('active', true);
        });
    });

    describe('three currencies', () => {
        test('first is current', () => {
            const wrapper = shallow(
                <Changer.View
                    dispatch={dispatch}
                    model={Changer.init(USD.code)}
                    amount="100"
                    currencies={[ USD, EUR, RUB ]}
                    pair={Nothing}
                />
            );

            expect(wrapper.find('Carousel')).toContainMatchingElements(2, 'Slide');

            expect(wrapper.find('Carousel').childAt(0)).toHaveProp('amount', '100');
            expect(wrapper.find('Carousel').childAt(0)).toHaveProp('currency', USD);

            expect(wrapper.find('Carousel').childAt(1)).toHaveProp('amount', '');
            expect(wrapper.find('Carousel').childAt(1)).toHaveProp('currency', EUR);

            expect(wrapper.find('Line')).toContainMatchingElements(3, 'Point');

            expect(wrapper.find('Line').childAt(0)).toHaveProp('active', true);
        });

        test('second is current', () => {
            const wrapper = shallow(
                <Changer.View
                    dispatch={dispatch}
                    model={Changer.init(EUR.code)}
                    amount="100"
                    currencies={[ USD, EUR, RUB ]}
                    pair={Nothing}
                />
            );

            expect(wrapper.find('Carousel')).toContainMatchingElements(3, 'Slide');

            expect(wrapper.find('Carousel').childAt(0)).toHaveProp('amount', '');
            expect(wrapper.find('Carousel').childAt(0)).toHaveProp('currency', USD);

            expect(wrapper.find('Carousel').childAt(1)).toHaveProp('amount', '100');
            expect(wrapper.find('Carousel').childAt(1)).toHaveProp('currency', EUR);

            expect(wrapper.find('Carousel').childAt(2)).toHaveProp('amount', '');
            expect(wrapper.find('Carousel').childAt(2)).toHaveProp('currency', RUB);

            expect(wrapper.find('Line')).toContainMatchingElements(3, 'Point');

            expect(wrapper.find('Line').childAt(1)).toHaveProp('active', true);
        });

        test('third is current', () => {
            const wrapper = shallow(
                <Changer.View
                    dispatch={dispatch}
                    model={Changer.init(RUB.code)}
                    amount="100"
                    currencies={[ USD, EUR, RUB ]}
                    pair={Nothing}
                />
            );

            expect(wrapper.find('Carousel')).toContainMatchingElements(2, 'Slide');

            expect(wrapper.find('Carousel').childAt(0)).toHaveProp('amount', '');
            expect(wrapper.find('Carousel').childAt(0)).toHaveProp('currency', EUR);

            expect(wrapper.find('Carousel').childAt(1)).toHaveProp('amount', '100');
            expect(wrapper.find('Carousel').childAt(1)).toHaveProp('currency', RUB);

            expect(wrapper.find('Line')).toContainMatchingElements(3, 'Point');

            expect(wrapper.find('Line').childAt(2)).toHaveProp('active', true);
        });
    });

    describe('hold sliding currency while it is sliding', () => {
        const model: Changer.Model = {
            currency: EUR.code,
            dragging: Nothing,
            sliding: Just({
                currency: Just(USD.code),
                duration: 100,
                destination: 800
            })
        };
        const wrapper = shallow(
            <Changer.View
                dispatch={dispatch}
                model={model}
                amount="100"
                currencies={[ USD, EUR, RUB ]}
                pair={Nothing}
            />
        );

        expect(wrapper.find('Carousel')).toContainMatchingElements(2, 'Slide');

        expect(wrapper.find('Carousel').childAt(0)).toHaveProp('amount', '100');
        expect(wrapper.find('Carousel').childAt(0)).toHaveProp('currency', USD);

        expect(wrapper.find('Carousel').childAt(1)).toHaveProp('amount', '');
        expect(wrapper.find('Carousel').childAt(1)).toHaveProp('currency', EUR);

        expect(wrapper.find('Line')).toContainMatchingElements(3, 'Point');

        expect(wrapper.find('Line').childAt(1)).toHaveProp('active', true);
    });

    describe('drag events are attaching', () => {
        test('no dragging, no sliding', () => {
            const model: Changer.Model = {
                currency: EUR.code,
                dragging: Nothing,
                sliding: Nothing
            };
            const wrapper = shallow(
                <Changer.View
                    dispatch={dispatch}
                    model={model}
                    amount="100"
                    currencies={[ USD, EUR, RUB ]}
                    pair={Nothing}
                />
            );

            expect(wrapper).toHaveProp('onTouchStart');
            expect(wrapper).not.toHaveProp('onTouchMove');
            expect(wrapper).not.toHaveProp('onTouchEnd');
        });

        test('dragging, no sliding', () => {
            const model: Changer.Model = {
                currency: EUR.code,
                dragging: Just({
                    ref: React.createRef<HTMLDivElement>(),
                    start: 0,
                    delta: Nothing
                }),
                sliding: Nothing
            };
            const wrapper = shallow(
                <Changer.View
                    dispatch={dispatch}
                    model={model}
                    amount="100"
                    currencies={[ USD, EUR, RUB ]}
                    pair={Nothing}
                />
            );

            expect(wrapper).not.toHaveProp('onTouchStart');
            expect(wrapper).toHaveProp('onTouchMove');
            expect(wrapper).toHaveProp('onTouchEnd');
        });

        test('no dragging, sliding', () => {
            const model: Changer.Model = {
                currency: EUR.code,
                dragging: Nothing,
                sliding: Just({
                    currency: Just(USD.code),
                    duration: 100,
                    destination: 800
                })
            };
            const wrapper = shallow(
                <Changer.View
                    dispatch={dispatch}
                    model={model}
                    amount="100"
                    currencies={[ USD, EUR, RUB ]}
                    pair={Nothing}
                />
            );

            expect(wrapper).not.toHaveProp('onTouchStart');
            expect(wrapper).not.toHaveProp('onTouchMove');
            expect(wrapper).not.toHaveProp('onTouchEnd');
        });
    });

    describe('shift according dragging.delta', () => {
        test('no dragging at all', () => {
            const model: Changer.Model = {
                currency: EUR.code,
                dragging: Nothing,
                sliding: Nothing
            };
            const wrapper = shallow(
                <Changer.View
                    dispatch={dispatch}
                    model={model}
                    amount="100"
                    currencies={[ USD, EUR, RUB ]}
                    pair={Nothing}
                />
            );

            expect(wrapper.find('Carousel')).toHaveProp('shift', 0);
        });

        test('delta is nothing', () => {
            const model: Changer.Model = {
                currency: EUR.code,
                dragging: Just({
                    ref: React.createRef<HTMLDivElement>(),
                    start: 0,
                    delta: Nothing
                }),
                sliding: Nothing
            };
            const wrapper = shallow(
                <Changer.View
                    dispatch={dispatch}
                    model={model}
                    amount="100"
                    currencies={[ USD, EUR, RUB ]}
                    pair={Nothing}
                />
            );

            expect(wrapper.find('Carousel')).toHaveProp('shift', 0);
        });

        test('delta exists', () => {
            const model: Changer.Model = {
                currency: EUR.code,
                dragging: Just({
                    ref: React.createRef<HTMLDivElement>(),
                    start: 0,
                    delta: Just(30)
                }),
                sliding: Nothing
            };
            const wrapper = shallow(
                <Changer.View
                    dispatch={dispatch}
                    model={model}
                    amount="100"
                    currencies={[ USD, EUR, RUB ]}
                    pair={Nothing}
                />
            );

            expect(wrapper.find('Carousel')).toHaveProp('shift', 30);
        });
    });
});

describe('Changer.stringToAmount()', () => {
    test('empty string', () => {
        expect(Changer.stringToAmount('')).toBe('');
        expect(Changer.stringToAmount('  ')).toBe('');
    });

    test('zero', () => {
        expect(Changer.stringToAmount('0')).toBe('0');
        expect(Changer.stringToAmount('-0')).toBe('-0');
    });

    test('integer', () => {
        expect(Changer.stringToAmount('1')).toBe('1');
        expect(Changer.stringToAmount('-1')).toBe('-1');
    });

    test('float', () => {
        expect(Changer.stringToAmount('1.0')).toBe('1.0');
        expect(Changer.stringToAmount('1.1')).toBe('1.1');
        expect(Changer.stringToAmount('-1.0')).toBe('-1.0');
        expect(Changer.stringToAmount('-1.1')).toBe('-1.1');
    });

    test('replace commas to decimal', () => {
        expect(Changer.stringToAmount('0,')).toBe('0.');
        expect(Changer.stringToAmount('0,1')).toBe('0.1');
        expect(Changer.stringToAmount('-0,1')).toBe('-0.1');
        expect(Changer.stringToAmount('1,')).toBe('1.');
        expect(Changer.stringToAmount('1,1')).toBe('1.1');
        expect(Changer.stringToAmount('-1,')).toBe('-1.');
        expect(Changer.stringToAmount('-1,1')).toBe('-1.1');

    });

    test('keep single decimal', () => {
        expect(Changer.stringToAmount('0..')).toBe('0.');
        expect(Changer.stringToAmount('0.,')).toBe('0.');
        expect(Changer.stringToAmount('0,.')).toBe('0.');
        expect(Changer.stringToAmount('0,,')).toBe('0.');
        expect(Changer.stringToAmount('0.1.')).toBe('0.1');
        expect(Changer.stringToAmount('0.1,')).toBe('0.1');
        expect(Changer.stringToAmount('0,1.')).toBe('0.1');
        expect(Changer.stringToAmount('0,1,')).toBe('0.1');
    });

    test('keep only numbers, minuses and decimal', () => {
        expect(Changer.stringToAmount('-1234567890.')).toBe('-1234567890.');
        expect(Changer.stringToAmount(
            '\`~!@#$%^&*()_+= qwertyuiop[]\\ asdfghjkl;\' zxcvbnm QWERTYUIOP{}| ASDFGHJKL:" ZXCVBNM<>?'
        )).toBe('');

        expect(Changer.stringToAmount('10e')).toBe('10');
        expect(Changer.stringToAmount('1e0')).toBe('10');
        expect(Changer.stringToAmount('e10')).toBe('10');
    });

    test('remove leading zeros', () => {
        expect(Changer.stringToAmount('00')).toBe('0');
        expect(Changer.stringToAmount('-00')).toBe('-0');
        expect(Changer.stringToAmount('01')).toBe('1');
        expect(Changer.stringToAmount('-01')).toBe('-1');
        expect(Changer.stringToAmount('01.')).toBe('1.');
        expect(Changer.stringToAmount('-01.')).toBe('-1.');
        expect(Changer.stringToAmount('0001')).toBe('1');
        expect(Changer.stringToAmount('-0001')).toBe('-1');
    });

    test('add zero before leading decimal', () => {
        expect(Changer.stringToAmount('.')).toBe('0.');
        expect(Changer.stringToAmount('..')).toBe('0.');
        expect(Changer.stringToAmount('-.')).toBe('-0.');
        expect(Changer.stringToAmount('-..')).toBe('-0.');
        expect(Changer.stringToAmount('.0')).toBe('0.0');
        expect(Changer.stringToAmount('..0')).toBe('0.');
        expect(Changer.stringToAmount('-.0')).toBe('-0.0');
        expect(Changer.stringToAmount('-..0')).toBe('-0.');
    });

    test('format output number', () => {
        expect(Changer.stringToAmount('.00000')).toBe('0.00');
        expect(Changer.stringToAmount('-.00000')).toBe('-0.00');
        expect(Changer.stringToAmount('-.99999')).toBe('-0.99');
        expect(Changer.stringToAmount('99999')).toBe('99999');
        expect(Changer.stringToAmount('9.0')).toBe('9.0');
        expect(Changer.stringToAmount('99999.00000')).toBe('99999.00');
    });
});

describe('Changer.negateAmount()', () => {
    test('to negate', () => {
        expect(Changer.negateAmount('')).toBe('-');
        expect(Changer.negateAmount('0')).toBe('-0');
        expect(Changer.negateAmount('0.0')).toBe('-0.0');
        expect(Changer.negateAmount('1')).toBe('-1');
        expect(Changer.negateAmount('1.1')).toBe('-1.1');
    });

    test('to positive', () => {
        expect(Changer.negateAmount('-')).toBe('');
        expect(Changer.negateAmount('-0')).toBe('0');
        expect(Changer.negateAmount('-0.0')).toBe('0.0');
        expect(Changer.negateAmount('-1')).toBe('1');
        expect(Changer.negateAmount('-1.1')).toBe('1.1');
    });
});

describe('Changer.extractCurrencies()', () => {
    test('empty currencies', () => {
        expect(Changer.extractCurrencies([], RUB.code)).toEqual(Nothing);
    });

    test('currency doesn\'t exist in list', () => {
        expect(Changer.extractCurrencies([ EUR, USD, GBP, SEK ], RUB.code)).toEqual(Nothing);
    });

    test('currency is alone', () => {
        expect(Changer.extractCurrencies([ RUB ], RUB.code)).toEqual(Just({
            prev: Nothing,
            current: RUB,
            next: Nothing
        }));
    });

    test('prev currency exists', () => {
        expect(Changer.extractCurrencies([ EUR, RUB ], RUB.code)).toEqual(Just({
            prev: Just(EUR),
            current: RUB,
            next: Nothing
        }));
    });

    test('next currency exists', () => {
        expect(Changer.extractCurrencies([ RUB, USD ], RUB.code)).toEqual(Just({
            prev: Nothing,
            current: RUB,
            next: Just(USD)
        }));
    });

    test('next and prev currencies exist', () => {
        expect(Changer.extractCurrencies([ EUR, RUB, USD ], RUB.code)).toEqual(Just({
            prev: Just(EUR),
            current: RUB,
            next: Just(USD)
        }));
    });

    test('different position', () => {
        expect(Changer.extractCurrencies([ RUB, EUR, USD, GBP, SEK ], RUB.code)).toEqual(Just({
            prev: Nothing,
            current: RUB,
            next: Just(EUR)
        }));

        expect(Changer.extractCurrencies([ EUR, RUB, USD, GBP, SEK ], RUB.code)).toEqual(Just({
            prev: Just(EUR),
            current: RUB,
            next: Just(USD)
        }));

        expect(Changer.extractCurrencies([ EUR, USD, RUB, GBP, SEK ], RUB.code)).toEqual(Just({
            prev: Just(USD),
            current: RUB,
            next: Just(GBP)
        }));

        expect(Changer.extractCurrencies([ EUR, USD, GBP, RUB, SEK ], RUB.code)).toEqual(Just({
            prev: Just(GBP),
            current: RUB,
            next: Just(SEK)
        }));

        expect(Changer.extractCurrencies([ EUR, USD, GBP, SEK, RUB ], RUB.code)).toEqual(Just({
            prev: Just(SEK),
            current: RUB,
            next: Nothing
        }));
    });
});
