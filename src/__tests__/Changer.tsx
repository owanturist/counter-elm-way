import 'jest'; // tslint:disable-line:no-import-side-effect

import * as React from 'react';
// import {
//     shallow
// } from 'enzyme';
import {
    Nothing,
    Just
} from 'Fractal/Maybe';

import * as Changer from '../Changer';

describe('Changer.init()', () => {
    expect(Changer.init('RUB')).toEqual({
        currency: 'RUB',
        dragging: Nothing,
        sliding: Nothing
    });
});

describe('Changer.isSame()', () => {
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
