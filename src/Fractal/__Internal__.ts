import {
    Maybe,
    Nothing,
    Just
} from './Maybe';
import {
    Either,
    Left,
    Right
} from './Either';

/* P R O C E S S */

export abstract class Process {
    public static sleep(delay: number): Task<never, void> {
        return TaskInternal.of((done: (task: Task<never, void>) => void): Process => {
            const timeoutID = setTimeout(() => done(Task.succeed(undefined)), delay);

            return new ProcessSingle(() => clearTimeout(timeoutID));
        });
    }

    public abstract kill(): Task<never, void>;
}

export abstract class ProcessInternal extends Process {
    public static of(abort: () => void): Process {
        return new ProcessSingle(abort);
    }

    public static get none(): Process {
        return processNone;
    }
}

class ProcessSingle extends Process {
    public constructor(private readonly abort: () => void) {
        super();
    }

    public kill(): Task<never, void> {
        return TaskInternal.of((done: (task: Task<never, void>) => void): Process => {
            done(Task.succeed(this.abort()));

            return processNone;
        });
    }
}

const processNone: Process = new class ProcessNone extends Process {
    public kill(): Task<never, void> {
        return Task.succeed(undefined);
    }
}();

/* R O U T E R */

export abstract class Router<AppMsg, SelfMsg, State> {
    public abstract init(): Task<never, State>;

    public abstract onEffects(
        sendToSelf: (selfMsg: SelfMsg) => Task<never, void>,
        effects: Array<unknown>,
        state: State
    ): Task<never, State>;

    public abstract onSelfMsg(
        sendToApp: (appMsg: AppMsg) => Task<never, void>,
        interval: SelfMsg,
        state: State
    ): Task<never, State>;
}

/* E F F E C T */

export abstract class Effect<Msg> {
    public abstract router: Router<Msg, unknown, unknown>;

    public abstract map<R>(fn: (msg: Msg) => R): Effect<R>;

    public toSub(): Sub<Msg> {
        return new SubSingle(this);
    }
}

/* S U B */

export abstract class Sub<Msg> {
    public static batch<Msg>(subs: Array<Sub<Msg>>): Sub<Msg> {
        const nonEmptySubs = subs.filter((sub: Sub<Msg>): boolean => !sub.isEmpty());

        switch (nonEmptySubs.length) {
            case 0: {
                return subNone;
            }

            case 1: {
                return nonEmptySubs[ 0 ];
            }

            default: {
                return new SubBatch(nonEmptySubs);
            }
        }
    }

    public static get none(): Sub<never> {
        return subNone;
    }

    protected static toEffects<Msg>(sub: Sub<Msg>): Array<Effect<Msg>> {
        return sub.toEffects();
    }

    public abstract map<R>(fn: (msg: Msg) => R): Sub<R>;

    protected abstract toEffects(): Array<Effect<Msg>>;

    protected abstract isEmpty(): boolean;
}

export abstract class SubInternal<Msg> extends Sub<Msg> {
    public static toEffects<Msg>(sub: Sub<Msg>): Array<Effect<Msg>> {
        return super.toEffects(sub);
    }
}

class SubSingle<Msg> extends Sub<Msg> {
    constructor(private readonly effect: Effect<Msg>) {
        super();
    }

    public map<R>(fn: (msg: Msg) => R): Sub<R> {
        return new SubSingle(
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

const subNone: Sub<never> = new class SubNone<Msg> extends Sub<Msg> {
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

class SubBatch<Msg> extends Sub<Msg> {
    constructor(private readonly subs: Array<Sub<Msg>>) {
        super();
    }

    public map<R>(fn: (msg: Msg) => R): Sub<R> {
        const result: Array<Sub<R>> = [];

        for (const sub of this.subs) {
            result.push(sub.map(fn));
        }

        return new SubBatch(result);
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

/* C M D */

export abstract class Cmd<Msg> {
    public static batch<Msg>(cmds: Array<Cmd<Msg>>): Cmd<Msg> {
        const nonEmptyCmds = cmds.filter((cmd: Cmd<Msg>): boolean => !cmd.isEmpty());

        switch (nonEmptyCmds.length) {
            case 0: {
                return cmdNone;
            }

            case 1: {
                return nonEmptyCmds[ 0 ];
            }

            default: {
                return new CmdBatch(nonEmptyCmds);
            }
        }
    }

    public static get none(): Cmd<never> {
        return cmdNone;
    }

    protected static execute<Msg>(cmd: Cmd<Msg>): Array<Promise<Msg>> {
        return cmd.execute();
    }

    public abstract map<R>(fn: (msg: Msg) => R): Cmd<R>;

    protected abstract execute(): Array<Promise<Msg>>;

    protected abstract isEmpty(): boolean;
}

export abstract class CmdInternal<Msg> extends Cmd<Msg> {
    public static of<E, T, Msg>(tagger: (result: Either<E, T>) => Msg, task: Task<E, T>): Cmd<Msg> {
        return new CmdSingle(tagger, task);
    }

    public static execute<Msg>(cmd: Cmd<Msg>): Array<Promise<Msg>> {
        return super.execute(cmd);
    }
}

class CmdSingle<E, T, Msg> extends Cmd<Msg> {
    constructor(
        private readonly tagger: (result: Either<E, T>) => Msg,
        private readonly task: Task<E, T>
    ) {
        super();
    }

    public map<R>(fn: (msg: Msg) => R): Cmd<R> {
        return new CmdSingle(
            (result: Either<E, T>): R => fn(this.tagger(result)),
            this.task
        );
    }

    protected execute(): Array<Promise<Msg>> {
        return [
            TaskInternal.execute(this.task)
                .then((value: T): Msg => this.tagger(Right(value)))
                .catch((error: E): Msg => this.tagger(Left(error)))
        ];
    }

    protected isEmpty(): boolean {
        return false;
    }
}

const cmdNone: Cmd<never> = new class CmdNone<Msg> extends Cmd<Msg> {
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

class CmdBatch<Msg> extends Cmd<Msg> {
    constructor(private readonly cmds: Array<Cmd<Msg>>) {
        super();
    }

    public map<R>(fn: (msg: Msg) => R): Cmd<R> {
        const result: Array<Cmd<R>> = [];

        for (const cmd of this.cmds) {
            result.push(cmd.map(fn));
        }

        return new CmdBatch(result);
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

/* T A S K */

export abstract class Task<E, T> {
    public static succeed<T>(value: T): Task<never, T> {
        return new TaskSucceed(value);
    }

    public static fail<E>(error: E): Task<E, never> {
        return new TaskFail(error);
    }

    public static props<E, T extends object>(
        config: {[ K in keyof T ]: Task<E, T[ K ]>}
    ): Task<E, T> {
        let acc: Task<E, T> = Task.succeed({} as T);

        for (const key in config) {
            if (config.hasOwnProperty(key)) {
                acc = acc.chain(
                    (obj: T): Task<E, T> => config[ key ].map(
                        (value: T[ Extract<keyof T, string> ]): T => {
                            obj[ key ] = value;

                            return obj;
                        }
                    )
                );
            }
        }

        return acc;
    }

    public static sequence<E, T>(tasks: Array<Task<E, T>>): Task<E, Array<T>> {
        let acc: Task<E, Array<T>> = Task.succeed([]);

        for (const task of tasks) {
            acc = acc.chain(
                (arr: Array<T>): Task<E, Array<T>> => task.map(
                    (value: T): Array<T> => {
                        arr.push(value);

                        return arr;
                    }
                )
            );
        }

        return acc;
    }

    protected static execute<E, T>(task: Task<E, T>): Promise<T> {
        return task.execute();
    }

    protected process: Maybe<Process> = Nothing;

    public map<R>(fn: (value: T) => R): Task<E, R> {
        return new TaskMap(fn, this);
    }

    public chain<R>(fn: (value: T) => Task<E, R>): Task<E, R> {
        return new TaskChain(fn, this);
    }

    public onError<S>(fn: (error: E) => Task<S, T>): Task<S, T> {
        return new TaskOnError(fn, this);
    }

    public mapError<S>(fn: (error: E) => S): Task<S, T> {
        return new TaskMapError(fn, this);
    }

    public attempt<M>(tagger: (either: Either<E, T>) => M): Cmd<M> {
        return CmdInternal.of(tagger, this);
    }

    public perform<M>(tagger: [ E ] extends [ never ] ? (value: T) => M : never): Cmd<M> {
        return CmdInternal.of(tagger as unknown as (result: Either<E, T>) => M, this);
    }

    public abstract pipe<S>(
        task: T extends (value: infer A) => unknown
            ? Task<[ E ] extends [ never ] ? S : E, A>
            : never
    ): Task<[ E ] extends [ never ] ? S : E, T extends (value: unknown) => infer U ? U : T>;

    public abstract spawn(): Task<never, Process>;

    protected abstract execute(): Promise<T>;
}

export abstract class TaskInternal<E, T> extends Task<E, T> {
    public static of<E, T>(
        callback: (done: (task: Task<E, T>) => void) => Process
    ): Task<E, T> {
        return new TaskSingle(callback);
    }

    public static execute<E, T>(task: Task<E, T>): Promise<T> {
        return super.execute(task);
    }
}

abstract class TaskStreamable<E, T> extends Task<E, T> {
    public pipe<S, A, U>(
        task: T extends (value: A) => unknown
            ? Task<[ E ] extends [ never ] ? S : E, A>
            : never
    ): Task<[ E ] extends [ never ] ? S : E, T extends (value: unknown) => U ? U : T> {
        return new TaskPipe(task, this as unknown as Task<
            [ E ] extends [ never ] ? S : E,
            (value: A) => T extends (value: unknown) => U ? U : T
        >);
    }
}

class TaskPipe<E, T, R> extends TaskStreamable<E, R> {
    constructor(
        private readonly value: Task<E, T>,
        private readonly fn: Task<E, (value: T) => R>
    ) {
        super();
    }

    public spawn(): Task<never, Process> {
        return this.fn.spawn();
    }

    public execute(): Promise<R> {
        return Task.execute(this.fn).then(
            (fn: (value: T) => R): Promise<R> => Task.execute(this.value).then(fn)
        );
    }
}

class TaskSingle<E, T> extends TaskStreamable<E, T> {
    constructor(
        private readonly callback: (done: (task: Task<E, T>) => void) => Process
    ) {
        super();
    }

    public spawn(): Task<never, Process> {
        return new TaskSingle((done: (task: Task<never, Process>) => void): Process => {
            this.execute();

            done(Task.succeed(this.process.getOrElse(ProcessInternal.none)));

            return ProcessInternal.none;
        });
    }

    protected execute(): Promise<T> {
        return new Promise((resolve: (value: T) => void, reject: (error: E) => void): void => {
            const process = this.callback((task: Task<E, T>) => {
                return Task
                    .execute(task)
                    .then(resolve, reject)
                    .then((): void => {
                        this.process = Nothing;
                    });
            });

            this.process = Just(process);
        });
    }
}

class TaskSucceed<T> extends TaskStreamable<never, T> {
    constructor(private readonly value: T) {
        super();
    }

    public spawn(): Task<never, Process> {
        return Task.succeed(ProcessInternal.none);
    }

    protected execute(): Promise<T> {
        return Promise.resolve(this.value);
    }
}

class TaskFail<E> extends TaskStreamable<E, never> {
    constructor(private readonly error: E) {
        super();
    }

    public spawn(): Task<never, Process> {
        return Task.succeed(ProcessInternal.none);
    }

    protected execute<T>(): Promise<T> {
        return Promise.reject(this.error);
    }
}

class TaskMap<E, T, R> extends TaskStreamable<E, R> {
    constructor(
        private readonly fn: (value: T) => R,
        private readonly task: Task<E, T>
    ) {
        super();
    }

    public spawn(): Task<never, Process> {
        return this.task.spawn();
    }

    protected execute(): Promise<R> {
        return Task.execute(this.task).then(this.fn);
    }
}

class TaskChain<E, T, R> extends TaskStreamable<E, R> {
    constructor(
        private readonly fn: (value: T) => Task<E, R>,
        private readonly task: Task<E, T>
    ) {
        super();
    }

    public spawn(): Task<never, Process> {
        return this.task.spawn();
    }

    protected execute(): Promise<R> {
        return Task.execute(this.task).then((value: T) => Task.execute(this.fn(value)));
    }
}

class TaskOnError<E, T, S> extends TaskStreamable<S, T> {
    constructor(
        private readonly fn: (error: E) => Task<S, T>,
        private readonly task: Task<E, T>
    ) {
        super();
    }

    public spawn(): Task<never, Process> {
        return this.task.spawn();
    }

    protected execute(): Promise<T> {
        return Task.execute(this.task).catch((error: E): Promise<T> => Task.execute(this.fn(error)));
    }
}

class TaskMapError<E, T, S> extends TaskStreamable<S, T> {
    constructor(
        private readonly fn: (error: E) => S,
        private readonly task: Task<E, T>
    ) {
        super();
    }

    public spawn(): Task<never, Process> {
        return this.task.spawn();
    }

    protected execute(): Promise<T> {
        return Task.execute(this.task).catch((error: E): Promise<T> => Promise.reject(this.fn(error)));
    }
}

/* P R O G R A M */

export class Program<Flags, Model, Msg> {
    public static worker<Flags, Model, Msg>(config: {
        init(flags: Flags): [ Model, Cmd<Msg> ];
        update(msg: Msg, model: Model): [ Model, Cmd<Msg> ];
        subscriptions(model: Model): Sub<Msg>;
    }): Program<Flags, Model, Msg> {
        return new Program(config.init, config.update, config.subscriptions);
    }

    protected constructor(
        private readonly init_: (flags: Flags) => [ Model, Cmd<Msg> ],
        private readonly update: (msg: Msg, model: Model) => [ Model, Cmd<Msg> ],
        private readonly subscriptions: (model: Model) => Sub<Msg>
    ) {}

    public init(flags: Flags): Runtime<Model, Msg> {
        return new WokrerRuntime(this.init_(flags), this.update, this.subscriptions);
    }
}

/* R U N T I M E */

export abstract class Runtime<Model, Msg> {
    public abstract getModel(): Model;

    public abstract dispatch(msg: Msg): void;

    public abstract subscribe(listener: () => void): () => void;
}

class WokrerRuntime<Model, Msg> extends Runtime<Model, Msg> {
    private routers: Map<Router<Msg, unknown, unknown>, unknown> = new Map();

    private model: Model;

    private readonly subscribers: Array<(model: Model) => void> = [];

    public constructor(
        [ initialModel, initialCmd ]: [ Model, Cmd<Msg> ],
        private readonly update: (msg: Msg, model: Model) => [ Model, Cmd<Msg> ],
        private readonly subscriptions: (model: Model) => Sub<Msg>
    ) {
        super();

        this.model = initialModel;

        this.executeSub(subscriptions(initialModel));

        this.executeCmd(initialCmd).then(() => {
            console.log('Initial Cmd has been done'); // tslint:disable-line:no-console
        });
    }

    public getModel(): Model {
        return this.model;
    }

    public dispatch(msg: Msg): void {
        this.applyMsg(msg);
    }

    public subscribe(listener: () => void): () => void {
        this.subscribers.push(listener);

        return () => {
            this.subscribers.splice(this.subscribers.indexOf(listener), 1);
        };
    }

    private applyMsg(msg: Msg): Promise<Array<Msg>> {
        const [ nextModel, cmd ] = this.update(msg, this.model);

        this.executeSub(this.subscriptions(nextModel));

        if (this.model !== nextModel) {
            this.model = nextModel;

            for (const subscriber of this.subscribers) {
                subscriber(nextModel);
            }
        }

        return this.executeCmd(cmd);
    }

    private executeCmd(cmd: Cmd<Msg>): Promise<Array<Msg>> {
        const result: Array<Promise<Array<Msg>>> = [];

        for (const promise of CmdInternal.execute(cmd)) {
            result.push(promise.then((msg: Msg) => this.applyMsg(msg)));
        }

        return Promise.all(result).then((arrayOfArrays: Array<Array<Msg>>): Array<Msg> => {
            return ([] as Array<Msg>).concat(...arrayOfArrays);
        });
    }

    private executeSub(sub: Sub<Msg>): void {
        const bags: Map<Router<Msg, unknown, unknown>, Array<Effect<Msg>>> = new Map();

        for (const effect of SubInternal.toEffects(sub)) {
            const bag = bags.get(effect.router);

            if (typeof bag === 'undefined') {
                bags.set(effect.router, [ effect ]);
            } else {
                bag.push(effect);
            }
        }

        const routers: Array<[ Router<Msg, unknown, unknown>, Task<never, unknown>, Array<Effect<Msg>> ]> = [];

        for (const [ router, state ] of this.routers) {
            routers.push([ router, Task.succeed(state), bags.get(router) || [] ]);
            bags.delete(router);
        }

        for (const [ router, effects ] of bags) {
            routers.push([ router, router.init(), effects ]);
        }

        const result: Array<Task<never, void>> = [];

        for (const [ router, stateTask, effects ] of routers) {
            const task = stateTask.chain((state: unknown): Task<never, void> => {
                return router.onEffects(
                    (selfMsg: unknown): Task<never, void> => {
                        return router.onSelfMsg(
                            (msg: Msg): Task<never, void> => {
                                return TaskInternal.of((done: (task: Task<never, void>) => void): Process => {
                                    this.applyMsg(msg).then(() => done(Task.succeed(undefined)));

                                    return ProcessInternal.none;
                                });
                            },
                            selfMsg,
                            stateTask
                        ).chain((nextState: unknown): Task<never, void> => {
                            this.routers.set(router, nextState);

                            return Task.succeed(undefined);
                        });
                    },
                    effects,
                    state
                ).chain((nextState: unknown): Task<never, void> => {
                    this.routers.set(router, nextState);

                    return Task.succeed(undefined);
                });
            });

            result.push(task);
        }
    }
}