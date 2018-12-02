import {
    Just
} from 'Fractal/Maybe';
import {
    Currency
} from '../Currency';

const EUR = Currency.of('EUR', '€', 0);
const USD = Currency.of('USD', '$', 0);

describe('Currency', () => {
    test('code', () => {
        expect(EUR.code).toBe('EUR');
    });

    test('symbol', () => {
        expect(EUR.symbol).toBe('€');
    });

    test('amount', () => {
        expect(EUR.amount).toBe(0);
    });
});

describe('Currency.registerRates()', () => {
    test('currency has no needed rate', () => {
        expect(
            EUR.convertTo(1, USD.code).isJust()
        ).toBe(false);
    });

    test('currency has needed rate', () => {
        expect(
            EUR.registerRates([
                [ 'USD', 1.3 ]
            ]).convertTo(1, USD.code).isJust()
        ).toBe(true);
    });
});

describe('Currency.convertTo()', () => {
    test('convert EUR to 1 USD', () => {
        expect(
            EUR.registerRates([
                [ 'USD', 2 ]
            ]).convertTo(1, USD.code)
        ).toEqual(Just(0.5));
    });
});

describe('Currency.convertFrom()', () => {
    test('convert USD from 1 EUR', () => {
        expect(
            USD.registerRates([
                [ 'EUR', 0.5 ]
            ]).convertFrom(1, EUR.code)
        ).toEqual(Just(0.5));
    });
});

describe('Currency.change()', () => {
    test('add 0', () => {
        const nextUSD = USD.change(0);

        expect(nextUSD.amount).toBe(0);
        expect(nextUSD).toBe(USD);
    });

    test('add 1', () => {
        const nextUSD = USD.change(1);

        expect(nextUSD.amount).toBe(1);
        expect(nextUSD).not.toBe(USD);
    });

    test('subtract 1', () => {
        const nextUSD = USD.change(-1);

        expect(nextUSD.amount).toBe(-1);
        expect(nextUSD).not.toBe(USD);
    });
});
