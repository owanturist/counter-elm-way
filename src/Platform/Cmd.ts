export abstract class Cmd<T> {
    public static of<T>(promiseCall: () => Promise<T>): Cmd<T> {
        return new Single(promiseCall);
    }

    public static batch<T>(cmds: Array<Cmd<T>>): Cmd<T> {
        return new Batch(cmds);
    }

    public static none<T>(): Cmd<T> {
        return new None();
    }

    protected static concat<T>(left: Cmd<T>, right: Cmd<T>): Cmd<T> {
        return left.concat(right);
    }

    protected static execute<T>(cmd: Cmd<T>): Promise<any> {
        return cmd.execute();
    }

    public abstract map<R>(fn: (value: T) => R): Cmd<R>;

    protected abstract concat(cmd: Cmd<T>): Cmd<T>;

    protected abstract execute(): Promise<any>;
}

class Single<T> extends Cmd<T> {
    constructor(private readonly promiseCall: () => Promise<T>) {
        super();
    }

    public map<R>(fn: (value: T) => R): Cmd<R> {
        return new Single(() => this.execute().then(fn));
    }

    protected concat(cmd: Cmd<T>): Cmd<T> {
        return new Batch([ this, cmd ]);
    }

    protected execute(): Promise<any> {
        return this.promiseCall();
    }
}

class None<T> extends Cmd<T> {
    public map<R>(): Cmd<R> {
        return new None();
    }

    protected concat(cmd: Cmd<T>): Cmd<T> {
        return cmd;
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

    protected concat(cmd: Cmd<T>): Cmd<T> {
        return new Batch([ ...this.cmds, cmd ]);
    }

    protected execute<R>(): Promise<any> {
        const result: Array<Promise<R>> = [];

        for (const cmd of this.cmds) {
            result.push(Cmd.execute(cmd));
        }

        return Promise.all(result);
    }
}
