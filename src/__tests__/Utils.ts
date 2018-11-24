import {
    Nothing,
    Just
} from 'Fractal/Maybe';
import * as Utils from '../Utils';

describe('Utils.find()', () => {
    test('empty array', () => {
        expect(
            Utils.find(() => true, [])
        ).toEqual(Nothing);
    });

    test('element not found', () => {
        expect(
            Utils.find(num => num > 3, [ 1, 2, 3 ])
        ).toEqual(Nothing);
    });

    test('element found', () => {
        expect(
            Utils.find(num => num > 1, [ 1, 2, 3 ])
        ).toEqual(Just(2));
    });
});

describe('Utils.stringToNumber()', () => {
    test('empty string', () => {
        expect(Utils.stringToNumber('')).toEqual(Nothing);
    });

    test('blank string', () => {
        expect(Utils.stringToNumber(' ')).toEqual(Nothing);
    });

    test('not number string', () => {
        expect(Utils.stringToNumber('str')).toEqual(Nothing);
    });

    test('number at the start of string', () => {
        expect(Utils.stringToNumber('0a')).toEqual(Nothing);
    });

    test('number at the end of string', () => {
        expect(Utils.stringToNumber('a0')).toEqual(Nothing);
    });

    test('zero number string', () => {
        expect(Utils.stringToNumber('0')).toEqual(Just(0));
    });

    test('negate number string', () => {
        expect(Utils.stringToNumber('-1.01')).toEqual(Just(-1.01));
    });

    test('positive number string', () => {
        expect(Utils.stringToNumber('+1.01')).toEqual(Just(1.01));
    });

    test('neutral number string', () => {
        expect(Utils.stringToNumber('+1.01')).toEqual(Just(1.01));
    });
});

describe('Utils.trunc()', () => {
    test('zero', () => {
        expect(Utils.trunc(2, 0)).toBe(0);
    });

    test('negate number', () => {
        expect(Utils.trunc(2, -1)).toBe(-1);
    });

    test('positive number', () => {
        expect(Utils.trunc(2, 1)).toBe(1);
    });

    test('single decimal', () => {
        expect(Utils.trunc(2, 1.1)).toBe(1.1);
    });

    test('double decimal', () => {
        expect(Utils.trunc(2, 1.01)).toBe(1.01);
    });

    test('triple decimal, trunc from last 1', () => {
        expect(Utils.trunc(2, 1.011)).toBe(1.01);
    });

    test('triple decimal, trunc from last 5', () => {
        expect(Utils.trunc(2, 1.015)).toBe(1.01);
    });

    test('triple decimal, trunc from last 6', () => {
        expect(Utils.trunc(2, 1.016)).toBe(1.01);
    });

    test('triple negate decimal, trunc from last 6', () => {
        expect(Utils.trunc(2, -1.016)).toBe(-1.01);
    });
});

describe('Urils.clamp()', () => {
    test('between', () => {
        expect(Utils.clamp(50, 100, 75)).toBe(75);
    });

    test('lower', () => {
        expect(Utils.clamp(50, 100, 25)).toBe(50);
    });

    test('higher', () => {
        expect(Utils.clamp(50, 100, 125)).toBe(100);
    });

    test('inversed borders between', () => {
        expect(Utils.clamp(100, 50, 75)).toBe(75);
    });

    test('inversed borders lower', () => {
        expect(Utils.clamp(100, 50, 25)).toBe(50);
    });

    test('inversed borders higher', () => {
        expect(Utils.clamp(100, 50, 125)).toBe(100);
    });
});
