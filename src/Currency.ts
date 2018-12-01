import {
    Maybe,
    Just
} from 'Fractal/Maybe';

export class Currency {
    public static of(code: string, symbol: string, amount: number) {
        return new Currency(code, symbol, amount, {});
    }

    constructor(
        public readonly code: string,
        public readonly symbol: string,
        public readonly amount: number,
        private readonly rates: {
            readonly [ code: string ]: number;
        }
    ) {}

    public registerRates(rates: Currency.Rates): Currency {
        const foreignPairs = rates.filter(([ code ]) => code !== this.code);

        if (foreignPairs.length === 0) {
            return this;
        }

        const newRates: {[ code: string ]: number } = {};

        for (const [ code, rate ] of foreignPairs) {
            newRates[ code ] = rate;
        }

        return new Currency(this.code, this.symbol, this.amount, { ...this.rates, ...newRates });
    }

    public convertTo(amount: number, foreign: string): Maybe<number> {
        if (this.code === foreign) {
            return Just(amount);
        }

        return Maybe.fromNullable(this.rates[ foreign ]).map(rate => amount / rate);
    }

    public convertFrom(amount: number, foreign: string): Maybe<number> {
        if (this.code === foreign) {
            return Just(amount);
        }

        return Maybe.fromNullable(this.rates[ foreign ]).map(rate => amount * rate);
    }

    public change(amount: number): Currency {
        if (amount === 0) {
            return this;
        }

        return new Currency(this.code, this.symbol, (this.amount * 100 + amount * 100) / 100, this.rates);
    }
}

export namespace Currency {
    export type Rates = Array<[ string, number ]>;
}
