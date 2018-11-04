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

test('Changer.init()', () => {
    expect(Changer.init('RUB')).toEqual({
        currency: 'RUB',
        dragging: Nothing,
        sliding: Nothing
    });
});

test('Changer.isSame()', () => {
    expect(
        Changer.isSame(Changer.init('RUB'), Changer.init('EUR'))
    ).toBe(false);

    expect(
        Changer.isSame(Changer.init('RUB'), Changer.init('RUB'))
    ).toBe(true);
});

describe('Changer.update()', () => {
    test('CHANGE_CURRENCY', () => {
        const initialModel = Changer.init('EUR');

        expect(
            Changer.update(
                { type: 'CHANGE_CURRENCY', currency: 'RUB'},
                initialModel
            )
        ).toEqual({
            type: 'UPDATED',
            currencyChanged: true,
            model: { ...initialModel, currency: 'RUB' }
        });
    });

    describe('CHANGE_AMOUNT', () => {
        test('empty amount', () => {
            expect(
                Changer.update(
                    { type: 'CHANGE_AMOUNT', amount: Nothing },
                    Changer.init('EUR')
                )
            ).toEqual({
                type: 'AMOUNT_CHANGED',
                amount: Nothing
            });
        });

        test('non empty amount', () => {
            expect(
                Changer.update(
                    { type: 'CHANGE_AMOUNT', amount: Just('20') },
                    Changer.init('EUR')
                )
            ).toEqual({
                type: 'AMOUNT_CHANGED',
                amount: Just('20')
            });
        });

    });

    test('DRAG_START', () => {
        const initialModel = Changer.init('EUR');

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
            const initialModel = Changer.init('EUR');

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
                currency: 'EUR',
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
                currency: 'EUR',
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
                currency: 'EUR',
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
                currency: 'EUR',
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
                currency: 'EUR',
                dragging: Just({
                    ref: React.createRef<HTMLDivElement>(),
                    start: 100,
                    delta: Nothing
                }),
                sliding: Nothing
            };

            expect(
                Changer.update(
                    { type: 'DRAG', prev: Nothing, next: Just('RUB'), end: -200, width: 800 },
                    initialModel
                )
            ).toEqual({
                type: 'UPDATED',
                currencyChanged: true,
                model: {
                    currency: 'RUB',
                    dragging: Nothing,
                    sliding: Just({
                        currency: Just('EUR'),
                        duration: 300,
                        destination: -800
                    })
                }
            });
        });

        test('dragging delta is more then third of width prev Currency', () => {
            const initialModel: Changer.Model = {
                currency: 'EUR',
                dragging: Just({
                    ref: React.createRef<HTMLDivElement>(),
                    start: 100,
                    delta: Nothing
                }),
                sliding: Nothing
            };

            expect(
                Changer.update(
                    { type: 'DRAG', prev: Just('RUB'), next: Nothing, end: 400, width: 800 },
                    initialModel
                )
            ).toEqual({
                type: 'UPDATED',
                currencyChanged: true,
                model: {
                    currency: 'RUB',
                    dragging: Nothing,
                    sliding: Just({
                        currency: Just('EUR'),
                        duration: 300,
                        destination: 800
                    })
                }
            });
        });
    });

    describe('DRAG_END', () => {
        test('drag has not been started', () => {
            const initialModel = Changer.init('EUR');

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
                currency: 'EUR',
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
                currency: 'EUR',
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
        const initialModel = Changer.init('EUR');

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
                model={Changer.init('RUB')}
                amount="100"
                currencies={[ Currency.of('USD', '$', 0) ]}
                donor={Nothing}
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
                donor={Nothing}
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
                    donor={Nothing}
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
                    donor={Nothing}
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
                    donor={Nothing}
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
                    donor={Nothing}
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
                    donor={Nothing}
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
                donor={Nothing}
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
                    donor={Nothing}
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
                    donor={Nothing}
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
                    donor={Nothing}
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
                    donor={Nothing}
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
                    donor={Nothing}
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
                    donor={Nothing}
                />
            );

            expect(wrapper.find('Carousel')).toHaveProp('shift', 30);
        });
    });
});
