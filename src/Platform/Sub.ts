import {
    Subscription
} from 'Platform';
import * as Encode from 'Json/Encode';

export abstract class Sub<T> {
    public static batch<T>(subs: Array<Sub<T>>): Sub<T> {
        const nonEmptySubs = subs.filter((sub: Sub<T>): boolean => !sub.isEmpty());

        switch (nonEmptySubs.length) {
            case 0: {
                return new None();
            }

            case 1: {
                return nonEmptySubs[ 0 ];
            }

            default: {
                return new Batch(nonEmptySubs);
            }
        }
    }

    public static none(): Sub<any> {
        return new None();
    }

    protected static cons<T>(
        namespace: string,
        key: Encode.Encoder,
        executor: () => () => void,
        tagger: (dispatch: (msg: T) => void) => void
    ): Sub<T> {
        return new Single(namespace, key, executor, tagger);
    }

    protected static configure<T>(sub: Sub<T>): Array<Subscription<T>> {
        return sub.configure();
    }

    protected static isEmpty<T>(sub: Sub<T>): boolean {
        return sub.isEmpty();
    }

    public abstract map<R>(fn: (msg: T) => R): Sub<R>;

    protected abstract configure(): Array<Subscription<T>>;

    protected abstract isEmpty(): boolean;
}

class Single<T> extends Sub<T> {
    constructor(
        private readonly namespace: string,
        private readonly key: Encode.Encoder,
        private readonly executor: () => () => void,
        private readonly tagger: (dispatch: (msg: T) => void) => void
    ) {
        super();
    }

    public map<R>(fn: (msg: T) => R): Sub<R> {
        return new Single(
            this.namespace,
            this.key,
            this.executor,
            (dispatch: (msg: R) => void) => (msg: T) => dispatch(fn(msg))
        );
    }

    protected configure(): Array<Subscription<T>> {
        return [{
            namespace: this.namespace,
            key: this.key,
            executor: this.executor,
            tagger: this.tagger
        }];
    }

    protected isEmpty(): boolean {
        return false;
    }
}

class None<T> extends Sub<T> {
    public map<R>(): Sub<R> {
        return this as any as None<R>;
    }

    protected configure(): Array<Subscription<T>> {
        return [];
    }

    protected isEmpty(): boolean {
        return true;
    }
}

class Batch<T> extends Sub<T> {
    constructor(private readonly subs: Array<Sub<T>>) {
        super();
    }

    public map<R>(fn: (msg: T) => R): Sub<R> {
        const result: Array<Sub<R>> = [];

        for (const sub of this.subs) {
            result.push(sub.map(fn));
        }

        return new Batch(result);
    }

    protected configure(): Array<Subscription<T>> {
        const result: Array<Subscription<T>> = [];

        for (const sub of this.subs) {
            result.push(...Sub.configure(sub));
        }

        return result;
    }

    protected isEmpty(): boolean {
        return this.subs.length === 0;
    }
}
