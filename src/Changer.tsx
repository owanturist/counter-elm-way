import React from 'react';

import {
    Maybe,
    Nothing,
    Just
} from 'Fractal/Maybe';
import {
    Either
} from 'Fractal/Either';
import {
    Dispatch
} from 'Fractal/Platform';
import {
    Cmd
} from 'Fractal/Platform/Cmd';
import {
    Sub
} from 'Fractal/Platform/Sub';

import {
    Wallet
} from './App';
import {
    Currency
} from './Currency';

export type Msg
    = { $: 'CHANGE_WEIGHT'; _0: Maybe<number> }
    | { $: 'CHANGE_CURRENT_CURRENCY'; _0: Currency }
    ;

const roundAmount = (amount: number): number => Math.round(amount * 100) / 100;

const inputToWeight = (currency: Currency, input: string): Maybe<number> => {
    if (input.trim() === '') {
        return Nothing();
    }

    const amount = Number(
        input.trim().replace(/(-?\d*(,|\.)?\d{0,2})(.*)/, '$1')
    );

    if (isNaN(amount)) {
        return Nothing();
    }

    return Just(currency.toWeight(amount));
};
