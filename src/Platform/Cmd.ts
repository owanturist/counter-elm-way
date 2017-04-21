export abstract class Cmd<T> {
    public static of<T>(promise: Promise<T>): Cmd<T> {
        return new Single(promise);
    }

    public static batch<T>(cmds: Array<Cmd<T>>): Cmd<T> {
        return new Batch(cmds);
    }

    public static none<T>(): Cmd<T> {
        return new None();
    }

    public static map<T, R>(f: (a: T) => R, cmd: Cmd<T>): Cmd<R> {
        return cmd.map(f);
    }

    public static concat<T>(cmdA: Cmd<T>, cmdB: Cmd<T>): Cmd<T> {
        return cmdA.concat(cmdB);
    }

    public static execute<T, R>(f: (a: T) => R, cmd: Cmd<T>): Promise<R> {
        return cmd.execute(f);
    }

    protected abstract map<R>(f: (a: T) => R): Cmd<R>;

    protected abstract concat(cmd: Cmd<T>): Cmd<T>;

    protected abstract execute<R>(f: (a: T) => R): Promise<R>;
}

class Single<T> extends Cmd<T> {
    constructor(private readonly promise: Promise<T>) {
        super();
    }

    protected map<R>(f: (a: T) => R): Cmd<R> {
        return new Single(this.execute(f));
    }

    protected concat(cmd: Cmd<T>): Cmd<T> {
        return new Batch([ this, cmd ]);
    }

    protected execute<R>(f: (a: T) => R): Promise<R> {
        return this.promise.then(f);
    }
}

class None<T> extends Cmd<T> {
    protected map(): Cmd<T> {
        return this;
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

    protected map<R>(f: (a: T) => R): Cmd<R> {
        return new Batch(
            this.cmds.map((cmd) => Cmd.map(f, cmd))
        );
    }

    protected concat(cmd: Cmd<T>): Cmd<T> {
        return new Batch([ ...this.cmds, cmd ]);
    }

    protected execute<R>(f: (a: T) => R): Promise<R[]> {
        return Promise.all(
            this.cmds.map((cmd) => Cmd.execute(f, cmd))
        );
    }
}
