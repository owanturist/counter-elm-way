export abstract class Cmd<Msg> {
    public static batch<Msg>(cmds: Array<Cmd<Msg>>): Cmd<Msg> {
        const nonEmptyCmds = cmds.filter((cmd: Cmd<Msg>): boolean => !Cmd.isEmpty(cmd));

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

    protected static cons<Msg>(callPromise: () => Promise<Msg>): Cmd<Msg> {
        return new Single(callPromise);
    }

    protected static execute<Msg>(cmd: Cmd<Msg>): Array<Promise<Msg>> {
        return cmd.execute();
    }

    protected static isEmpty<Msg>(cmd: Cmd<Msg>): boolean {
        return cmd.isEmpty();
    }

    public abstract map<R>(fn: (msg: Msg) => R): Cmd<R>;

    protected abstract execute(): Array<Promise<Msg>>;

    protected abstract isEmpty(): boolean;
}

class Single<Msg> extends Cmd<Msg> {
    constructor(private readonly callPromise: () => Promise<Msg>) {
        super();
    }

    public map<R>(fn: (msg: Msg) => R): Cmd<R> {
        return new Map(fn, this);
    }

    protected execute(): Array<Promise<Msg>> {
        return [ this.callPromise() ];
    }

    protected isEmpty(): boolean {
        return false;
    }
}

class Map<T, Msg> extends Cmd<Msg> {
    constructor(
        private readonly fn: (msg: T) => Msg,
        private readonly cmd: Cmd<T>
    ) {
        super();
    }

    public map<R>(fn: (msg: Msg) => R): Cmd<R> {
        return new Map(
            (msg: T): R => fn(this.fn(msg)),
            this.cmd
        );
    }

    protected execute(): Array<Promise<Msg>> {
        const result: Array<Promise<Msg>> = [];

        for (const promise of Cmd.execute(this.cmd)) {
            result.push(promise.then(this.fn));
        }

        return result;
    }

    protected isEmpty(): boolean {
        return Cmd.isEmpty(this.cmd);
    }
}

class None<Msg> extends Cmd<Msg> {
    public map<R>(): Cmd<R> {
        return this as any as Cmd<R>;
    }

    protected execute(): Array<Promise<Msg>> {
        return [];
    }

    protected isEmpty(): boolean {
        return true;
    }
}

class Batch<Msg> extends Cmd<Msg> {
    constructor(private readonly cmds: Array<Cmd<Msg>>) {
        super();
    }

    public map<R>(fn: (msg: Msg) => R): Cmd<R> {
        const result: Array<Cmd<R>> = [];

        for (const cmd of this.cmds) {
            result.push(cmd.map(fn));
        }

        return new Batch(result);
    }

    protected execute(): Array<Promise<Msg>> {
        const result: Array<Promise<Msg>> = [];

        for (const cmd of this.cmds) {
            result.push(...Cmd.execute(cmd));
        }

        return result;
    }

    protected isEmpty(): boolean {
        return this.cmds.length === 0;
    }
}
