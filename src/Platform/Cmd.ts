export abstract class Cmd<T> {
    public static batch<T>(cmds: Array<Cmd<T>>): Cmd<T> {
        const nonEmptyCmds = cmds.filter((cmd: Cmd<T>): boolean => !Cmd.isEmpty(cmd));

        switch (nonEmptyCmds.length) {
            case 0: {
                return new None();
            }

            case 1: {
                return nonEmptyCmds[ 0 ];
            }

            default: {
                return new Batch(nonEmptyCmds);
            }
        }
    }

    public static none(): Cmd<any> {
        return new None();
    }

    protected static cons<T>(callPromise: () => Promise<T>): Cmd<T> {
        return new Single(callPromise);
    }

    protected static execute<T, R>(fn: (msg: T) => R, cmd: Cmd<T>): Promise<R> {
        return cmd.execute(fn);
    }

    protected static isEmpty<T>(cmd: Cmd<T>): boolean {
        return cmd.isEmpty();
    }

    public abstract map<R>(fn: (msg: T) => R): Cmd<R>;

    protected abstract execute<R>(fn: (msg: T) => R): Promise<R>;

    protected abstract isEmpty(): boolean;
}

class Single<T> extends Cmd<T> {
    constructor(private readonly callPromise: () => Promise<T>) {
        super();
    }

    public map<R>(fn: (msg: T) => R): Cmd<R> {
        return new Map(fn, this);
    }

    protected execute<R>(fn: (msg: T) => R): Promise<R> {
        return this.callPromise().then(fn);
    }

    protected isEmpty(): boolean {
        return false;
    }
}

class Map<T, R> extends Cmd<R> {
    constructor(
        private readonly fn: (msg: T) => R,
        private readonly cmd: Cmd<T>
    ) {
        super();
    }

    public map<S>(fn: (msg: R) => S): Cmd<S> {
        return new Map(
            (msg: T): S => fn(this.fn(msg)),
            this.cmd
        );
    }

    protected execute<S>(fn: (msg: R) => S): Promise<S> {
        return Cmd.execute(
            (msg: T): S => fn(this.fn(msg)),
            this.cmd
        );
    }

    protected isEmpty(): boolean {
        return Cmd.isEmpty(this.cmd);
    }
}

class None<T> extends Cmd<T> {
    public map<R>(): Cmd<R> {
        return this;
    }

    protected execute(): Promise<any> {
        return Promise.resolve();
    }

    protected isEmpty(): boolean {
        return true;
    }
}

class Batch<T> extends Cmd<T> {
    constructor(private readonly cmds: Array<Cmd<T>>) {
        super();
    }

    public map<R>(fn: (msg: T) => R): Cmd<R> {
        const result: Array<Cmd<R>> = [];

        for (const cmd of this.cmds) {
            result.push(cmd.map(fn));
        }

        return new Batch(result);
    }

    protected execute<R>(fn: (msg: T) => R): Promise<any> {
        const result: Array<Promise<R>> = [];

        for (const cmd of this.cmds) {
            result.push(Cmd.execute(fn, cmd));
        }

        return Promise.all(result);
    }

    protected isEmpty(): boolean {
        return this.cmds.length === 0;
    }
}
