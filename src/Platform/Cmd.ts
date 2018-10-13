export abstract class Cmd<T> {
    public static of<T>(promiseCall: () => Promise<T>): Cmd<T> {
        return new Single(promiseCall);
    }

    public static batch<T>(cmds: Array<Cmd<T>>): Cmd<T> {
        return new Batch(cmds);
    }

    public static none(): Cmd<any> {
        return new None();
    }

    protected static execute<T, R>(fn: (value: T) => R, cmd: Cmd<T>): Promise<R> {
        return cmd.execute(fn);
    }

    public abstract map<R>(fn: (value: T) => R): Cmd<R>;

    protected abstract execute<R>(fn: (value: T) => R): Promise<R>;
}

class Single<T> extends Cmd<T> {
    constructor(private readonly promiseCall: () => Promise<T>) {
        super();
    }

    public map<R>(fn: (value: T) => R): Cmd<R> {
        return new Single(() => this.execute(fn));
    }

    protected execute<R>(fn: (value: T) => R): Promise<R> {
        return this.promiseCall().then(fn);
    }
}

class None<T> extends Cmd<T> {
    public map<R>(): Cmd<R> {
        return new None();
    }

    protected execute(): Promise<any> {
        return Promise.resolve();
    }
}

class Batch<T> extends Cmd<T> {
    constructor(private readonly cmds: Array<Cmd<T>>) {
        super();
    }

    public map<R>(fn: (value: T) => R): Cmd<R> {
        const result: Array<Cmd<R>> = [];

        for (const cmd of this.cmds) {
            result.push(cmd.map(fn));
        }

        return new Batch(result);
    }

    protected execute<R>(fn: (value: T) => R): Promise<any> {
        const result: Array<Promise<R>> = [];

        for (const cmd of this.cmds) {
            result.push(Cmd.execute(fn, cmd));
        }

        return Promise.all(result);
    }
}
