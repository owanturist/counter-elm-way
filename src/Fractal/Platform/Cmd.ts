import {
    Either,
    Left,
    Right
} from '../Either';
import {
    Task
} from '../Task';

abstract class InternalTask<E, T> extends Task<E, T> {
    public static execute<E, T>(task: Task<E, T>): Promise<T> {
        return super.execute(task);
    }
}

export abstract class Cmd<Msg> {
    public static batch<Msg>(cmds: Array<Cmd<Msg>>): Cmd<Msg> {
        const nonEmptyCmds = cmds.filter((cmd: Cmd<Msg>): boolean => !Cmd.isEmpty(cmd));

        switch (nonEmptyCmds.length) {
            case 0: {
                return none;
            }

            case 1: {
                return nonEmptyCmds[ 0 ];
            }

            default: {
                return new Batch(nonEmptyCmds);
            }
        }
    }

    public static get none(): Cmd<never> {
        return none;
    }

    protected static of<E, T, Msg>(tagger: (result: Either<E, T>) => Msg, task: Task<E, T>): Cmd<Msg> {
        return new Single(tagger, task);
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

class Single<E, T, Msg> extends Cmd<Msg> {
    constructor(
        private readonly tagger: (result: Either<E, T>) => Msg,
        private readonly task: Task<E, T>
    ) {
        super();
    }

    public map<R>(fn: (msg: Msg) => R): Cmd<R> {
        return new Single(
            (result: Either<E, T>): R => fn(this.tagger(result)),
            this.task
        );
    }

    protected execute(): Array<Promise<Msg>> {
        return [
            InternalTask.execute(this.task)
                .then((value: T): Msg => this.tagger(Right(value)))
                .catch((error: E): Msg => this.tagger(Left(error)))
        ];
    }

    protected isEmpty(): boolean {
        return false;
    }
}

const none: Cmd<never> = new class None<Msg> extends Cmd<Msg> {
    public map<R>(): Cmd<R> {
        return this as any as Cmd<R>;
    }

    protected execute(): Array<Promise<Msg>> {
        return [];
    }

    protected isEmpty(): boolean {
        return true;
    }
}();

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
