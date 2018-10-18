import {
    Maybe,
    Nothing,
    Just
} from 'Fractal/Maybe';

const codeToSymbol = (code: string): Maybe<string> => {
    switch (code) {
        case 'USD': {
            return Just('$');
        }

        case 'EUR': {
            return Just('€');
        }

        case 'GBP': {
            return Just('£');
        }

        default: {
            return Nothing();
        }
    }
};

export class Currency {
    public static of(code: string, weight: number) {
        return codeToSymbol(code).map((symbol: string) => new Currency(code, symbol, weight));
    }

    constructor(
        private readonly code: string,
        private readonly symbol: string,
        protected readonly weight: number // related USD
    ) {}

    public toCode(): string {
        return this.code;
    }

    public toSymbol(): string {
        return this.symbol;
    }

    public rateWith(target: Currency): number {
        return target.weight / this.weight;
    }

    public convertTo(amount: number, target: Currency): number {
        return amount * this.rateWith(target);
    }
}
