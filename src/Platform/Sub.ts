import {
    Subscriber
} from 'Platform';
import {
    Encoder
} from 'Json/Encode';

export abstract class Sub<Msg> {
    public static batch<Msg>(subs: Array<Sub<Msg>>): Sub<Msg> {
        const nonEmptySubs = subs.filter((sub: Sub<Msg>): boolean => !Sub.isEmpty(sub));

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

    protected static of<T, Msg>(
        namespace: string,
        key: Encoder,
        tagger: (config: T) => Msg,
        executor: (callback: (config: T) => void) => () => void
    ): Sub<Msg> {
        return new Single(namespace, key.encode(0), tagger, executor);
    }

    protected static configure<Msg>(sub: Sub<Msg>): Array<Subscriber<Msg>> {
        return sub.configure();
    }

    protected static isEmpty<Msg>(sub: Sub<Msg>): boolean {
        return sub.isEmpty();
    }

    public abstract map<R>(fn: (msg: Msg) => R): Sub<R>;

    protected abstract configure(): Array<Subscriber<Msg>>;

    protected abstract isEmpty(): boolean;
}

class Single<T, Msg> extends Sub<Msg> {
    constructor(
        private readonly namespace: string,
        private readonly key: string,
        private readonly tagger: (config: T) => Msg,
        private readonly executor: (callback: (config: T) => void) => () => void
    ) {
        super();
    }

    public map<R>(fn: (msg: Msg) => R): Sub<R> {
        return new Single(
            this.namespace,
            this.key,
            (config: T): R => fn(this.tagger(config)),
            this.executor
        );
    }

    protected configure(): Array<Subscriber<Msg>> {
        return [{
            namespace: this.namespace,
            key: this.key,
            tagger: this.tagger,
            executor: this.executor
        }];
    }

    protected isEmpty(): boolean {
        return false;
    }
}

class None<T> extends Sub<T> {
    public map<R>(): Sub<R> {
        return this as any as Sub<R>;
    }

    protected configure(): Array<Subscriber<T>> {
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

    protected configure(): Array<Subscriber<T>> {
        const result: Array<Subscriber<T>> = [];

        for (const sub of this.subs) {
            result.push(...Sub.configure(sub));
        }

        return result;
    }

    protected isEmpty(): boolean {
        return this.subs.length === 0;
    }
}
