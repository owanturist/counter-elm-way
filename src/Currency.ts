import {
    Maybe,
    Just
} from 'Fractal/Maybe';

import {
    ID as ID_
} from './ID';
import * as Utils from './Utils';

export class Currency {
    public static of(code: string, symbol: string, amount: number) {
        return new Currency(ID_.fromString(code), symbol, amount, {});
    }

    constructor(
        public readonly code: Currency.ID,
        public readonly symbol: string,
        public readonly amount: number,
        private readonly rates: {
            readonly [ code: string ]: number;
        }
    ) {}

    public registerRates(rates: Currency.Rates): Currency {
        const foreignPairs = rates.filter(([ code ]) => !this.code.isEqual(code));

        if (foreignPairs.length === 0) {
            return this;
        }

        const newRates: {[ code: string ]: number } = {};

        for (const [ code, rate ] of foreignPairs) {
            newRates[ code.toString() ] = rate;
        }

        return new Currency(this.code, this.symbol, this.amount, { ...this.rates, ...newRates });
    }

    public convertTo(amount: number, foreign: Currency.ID): Maybe<number> {
        if (this.code.isEqual(foreign)) {
            return Just(amount);
        }

        return Maybe.fromNullable(this.rates[ foreign.toString() ]).map(rate => amount / rate);
    }

    public convertFrom(amount: number, foreign: Currency.ID): Maybe<number> {
        if (this.code.isEqual(foreign)) {
            return Just(amount);
        }

        return Maybe.fromNullable(this.rates[ foreign.toString() ]).map(rate => amount * rate);
    }

    public change(amount: number): Currency {
        if (amount === 0) {
            return this;
        }

        return new Currency(this.code, this.symbol, Utils.round(2, this.amount + amount), this.rates);
    }
}

export namespace Currency {
    export type ID = ID_<'CURRENCY'>;

    export type Rates = Array<[ ID, number ]>;
}
