import 'jest'; // tslint:disable-line:no-import-side-effect

import {
    Just
} from 'Fractal/Maybe';
import {
    Currency
} from '../Currency';

const euro = Currency.of('EUR', '€', 0);
const dollar = Currency.of('USD', '$', 0);

test('Currency.(code|symbol|amount)', () => {
    expect(euro.code).toBe('EUR');
    expect(euro.symbol).toBe('€');
    expect(euro.amount).toBe(0);
});

test('Currency.registerRates()', () => {
    const euroWithDollarRate = euro.registerRates([
        [ 'USD', 1.3 ]
    ]);

    expect(
        euro.convertTo(1, dollar).isJust()
    ).toBe(false);

    expect(
        euroWithDollarRate.convertTo(1, dollar).isJust()
    ).toBe(true);
});

test('Currency.convertTo()', () => {
    expect(
        euro.registerRates([
            [ 'USD', 2 ]
        ]).convertTo(1, dollar)
    ).toEqual(Just(0.5));
});

test('Currency.convertFrom()', () => {
    expect(
        dollar.convertFrom(
            1,
            euro.registerRates([
                [ 'USD', 2 ]
            ])
        )
    ).toEqual(Just(2));
});
