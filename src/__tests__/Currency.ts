import 'jest'; // tslint:disable-line:no-import-side-effect

import {
    Just
} from 'Fractal/Maybe';
import {
    Currency
} from '../Currency';

const euro = Currency.of('EUR', '€', 0);
const dollar = Currency.of('USD', '$', 0);

describe('Currency', () => {
    test('code', () => {
        expect(euro.code).toBe('EUR');
    });

    test('symbol', () => {
        expect(euro.symbol).toBe('€');
    });

    test('amount', () => {
        expect(euro.amount).toBe(0);
    });
});

describe('Currency.registerRates()', () => {
    test('currency has no needed rate', () => {
        expect(
            euro.convertTo(1, dollar).isJust()
        ).toBe(false);
    });

    test('currency has needed rate', () => {
        expect(
            euro.registerRates([
                [ 'USD', 1.3 ]
            ]).convertTo(1, dollar).isJust()
        ).toBe(true);
    });
});

describe('Currency.convertTo()', () => {
    test('convert EUR to 1 USD', () => {
        expect(
            euro.registerRates([
                [ 'USD', 2 ]
            ]).convertTo(1, dollar)
        ).toEqual(Just(0.5));
    });
});

describe('Currency.convertFrom()', () => {
    test('convert USD from 1 EUR', () => {
        expect(
            dollar.convertFrom(
                1,
                euro.registerRates([
                    [ 'USD', 2 ]
                ])
            )
        ).toEqual(Just(2));
    });
});
