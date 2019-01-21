import {
    Effect
} from '../Router';

export abstract class Sub<Msg> {
    public static batch<Msg>(subs: Array<Sub<Msg>>): Sub<Msg> {
        const nonEmptySubs = subs.filter((sub: Sub<Msg>): boolean => !Sub.isEmpty(sub));

        switch (nonEmptySubs.length) {
            case 0: {
                return none;
            }

            case 1: {
                return nonEmptySubs[ 0 ];
            }

            default: {
                return new Batch(nonEmptySubs);
            }
        }
    }

    public static get none(): Sub<never> {
        return none;
    }

    protected static fromEffect<Msg>(effect: Effect<Msg>): Sub<Msg> {
        return new Single(effect);
    }

    protected static toEffects<Msg>(sub: Sub<Msg>): Array<Effect<Msg>> {
        return sub.toEffects();
    }

    protected static isEmpty<Msg>(sub: Sub<Msg>): boolean {
        return sub.isEmpty();
    }

    public abstract map<R>(fn: (msg: Msg) => R): Sub<R>;

    protected abstract toEffects(): Array<Effect<Msg>>;

    protected abstract isEmpty(): boolean;
}

class Single<Msg> extends Sub<Msg> {
    constructor(private readonly effect: Effect<Msg>) {
        super();
    }

    public map<R>(fn: (msg: Msg) => R): Sub<R> {
        return new Single(
            this.effect.map(fn)
        );
    }

    protected toEffects(): Array<Effect<Msg>> {
        return [ this.effect ];
    }

    protected isEmpty(): boolean {
        return false;
    }
}

const none: Sub<never> = new class None<Msg> extends Sub<Msg> {
    public map<R>(): Sub<R> {
        return this as any as Sub<R>;
    }

    protected toEffects(): Array<Effect<Msg>> {
        return [];
    }

    protected isEmpty(): boolean {
        return true;
    }
}();

class Batch<Msg> extends Sub<Msg> {
    constructor(private readonly subs: Array<Sub<Msg>>) {
        super();
    }

    public map<R>(fn: (msg: Msg) => R): Sub<R> {
        const result: Array<Sub<R>> = [];

        for (const sub of this.subs) {
            result.push(sub.map(fn));
        }

        return new Batch(result);
    }

    protected toEffects(): Array<Effect<Msg>> {
        const result: Array<Effect<Msg>> = [];

        for (const sub of this.subs) {
            result.push(...Sub.toEffects(sub));
        }

        return result;
    }

    protected isEmpty(): boolean {
        return this.subs.length === 0;
    }
}
