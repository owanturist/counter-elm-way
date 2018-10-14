export abstract class Cmd<M> {
    public static batch<M>(cmds: Array<Cmd<M>>): Cmd<M> {
        return new Batch(cmds);
    }

    public static none(): Cmd<any> {
        return new None();
    }

    protected static execute<M, R>(fn: (msg: M) => R, cmd: Cmd<M>): Promise<any> {
        return cmd.execute(fn);
    }

    protected static cons<M>(callPromise: () => Promise<M>): Cmd<M> {
        return new Single(callPromise);
    }

    public abstract map<R>(fn: (msg: M) => R): Cmd<R>;

    protected abstract execute<R>(fn: (msg: M) => R): Promise<R>;
}

class Single<M> extends Cmd<M> {
    constructor(private readonly callPromise: () => Promise<M>) {
        super();
    }

    public map<R>(fn: (msg: M) => R): Cmd<R> {
        return new Single(() => this.callPromise().then(fn));
    }

    protected execute<R>(fn: (msg: M) => R): Promise<R> {
        return this.callPromise().then(fn);
    }
}

class None<M> extends Cmd<M> {
    public map<R>(): Cmd<R> {
        return new None();
    }

    protected execute(): Promise<any> {
        return Promise.resolve();
    }
}

class Batch<M> extends Cmd<M> {
    constructor(private readonly cmds: Array<Cmd<M>>) {
        super();
    }

    public map<R>(fn: (msg: M) => R): Cmd<R> {
        const result: Array<Cmd<R>> = [];

        for (const cmd of this.cmds) {
            result.push(cmd.map(fn));
        }

        return new Batch(result);
    }

    protected execute<R>(fn: (msg: M) => R): Promise<any> {
        const result: Array<Promise<R>> = [];

        for (const cmd of this.cmds) {
            result.push(Cmd.execute(fn, cmd));
        }

        return Promise.all(result);
    }
}
