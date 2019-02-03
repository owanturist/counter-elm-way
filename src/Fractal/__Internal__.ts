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

export abstract class Router<AppMsg, SelfMsg = unknown, State = unknown> {
    private state: Maybe<State> = Nothing;

    public runEffects(
        sendToSelf: (selfMsg: SelfMsg) => Task<never, void>,
        effects: Array<Effect<AppMsg, SelfMsg, State>>
    ): Task<never, void> {
        return this.getState()
            .chain((state: State): Task<never, State> => this.onEffects(sendToSelf, effects, state))
            .chain((nextState: State): Task<never, void> => this.setState(nextState));
    }

    public executeMsg(
        sendToApp: (appMsgs: Array<AppMsg>) => Task<never, void>,
        msg: SelfMsg
    ): Task<never, void> {
        return this.getState()
            .chain((state: State): Task<never, State> => this.onSelfMsg(sendToApp, msg, state))
            .chain((nextState: State): Task<never, void> => this.setState(nextState));
    }

    protected abstract init(): Task<never, State>;

    protected abstract onEffects(
        sendToSelf: (selfMsg: SelfMsg) => Task<never, void>,
        effects: Array<Effect<AppMsg, SelfMsg, State>>,
        state: State
    ): Task<never, State>;

    protected abstract onSelfMsg(
        sendToApp: (appMsgs: Array<AppMsg>) => Task<never, void>,
        msg: SelfMsg,
        state: State
    ): Task<never, State>;

    private getState(): Task<never, State> {
        return this.state.fold(
            (): Task<never, State> => this.init(),
            (state: State): Task<never, State> => Task.succeed(state)
        );
    }

    private setState(nextState: State): Task<never, void> {
        this.state = Just(nextState);

        return Task.succeed(undefined);
    }
}

/* S U B */

export abstract class Sub<Msg> {
    public static get none(): Sub<never> {
        return new SubNone();
    }

    public static batch<Msg>(subs: Array<Sub<Msg>>): Sub<Msg> {
        return new SubBatch(subs);
    }

    protected static groupEffects<Msg>(
        acc: Map<() => Router<Msg>, Array<Effect<Msg>>>,
        sub: Sub<Msg>
    ): Map<() => Router<Msg>, Array<Effect<Msg>>> {
        return sub.groupEffects(acc);
    }

    public abstract map<R>(fn: (msg: Msg) => R): Sub<R>;

    protected abstract groupEffects(
        acc: Map<() => Router<Msg>, Array<Effect<Msg>>>
    ): Map<() => Router<Msg>, Array<Effect<Msg>>>;
}

abstract class SubInternal<Msg> extends Sub<Msg> {
    public static groupEffects<Msg>(
        acc: Map<() => Router<Msg>, Array<Effect<Msg>>>,
        sub: Sub<Msg>
    ): Map<() => Router<Msg>, Array<Effect<Msg>>> {
        return super.groupEffects(acc, sub);
    }
}

class SubNone<Msg> extends Sub<Msg> {
    public map<R>(): Sub<R> {
        return this as unknown as Sub<R>;
    }

    protected groupEffects(
        acc: Map<() => Router<Msg>, Array<Effect<Msg>>>
    ): Map<() => Router<Msg>, Array<Effect<Msg>>> {
        return acc;
    }
}

class SubBatch<Msg> extends Sub<Msg> {
    public constructor(private readonly subs: Array<Sub<Msg>>) {
        super();
    }

    public map<R>(fn: (msg: Msg) => R): Sub<R> {
        const result: Array<Sub<R>> = [];

        for (const sub of this.subs) {
            result.push(sub.map(fn));
        }

        return new SubBatch(result);
    }

    protected groupEffects(
        acc: Map<() => Router<Msg>, Array<Effect<Msg>>>
    ): Map<() => Router<Msg>, Array<Effect<Msg>>> {
        return this.subs.reduce(SubInternal.groupEffects, acc);
    }
}

export abstract class Effect<AppMsg, SelfMsg = unknown, State = unknown> extends Sub<AppMsg> {
    public abstract createRouter(): Router<AppMsg, SelfMsg, State>;

    protected groupEffects(
        acc: Map<() => Router<AppMsg, SelfMsg, State>, Array<Effect<AppMsg, SelfMsg, State>>>
    ): Map<() => Router<AppMsg, SelfMsg, State>, Array<Effect<AppMsg, SelfMsg, State>>> {
        const bag = acc.get(this.createRouter);

        if (bag == null) {
            return acc.set(this.createRouter, [ this ]);
        }

        bag.push(this);

        return acc;
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

class WokrerRuntime<Model, AppMsg> extends Runtime<Model, AppMsg> {
    private readonly routers: Map<() => Router<AppMsg>, Router<AppMsg>> = new Map();

    private model: Model;

    private readonly subscribers: Array<(model: Model) => void> = [];

    public constructor(
        [ initialModel, initialCmd ]: [ Model, Cmd<AppMsg> ],
        private readonly update: (msg: AppMsg, model: Model) => [ Model, Cmd<AppMsg> ],
        private readonly subscriptions: (model: Model) => Sub<AppMsg>
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

    public dispatch(msg: AppMsg): void {
        this.applyMsg(msg);
    }

    public subscribe(listener: () => void): () => void {
        this.subscribers.push(listener);

        return () => {
            this.subscribers.splice(this.subscribers.indexOf(listener), 1);
        };
    }

    private applyChanges(nextModel: Model, cmd: Cmd<AppMsg>): Promise<Array<AppMsg>> {
        this.executeSub(this.subscriptions(nextModel));

        if (this.model !== nextModel) {
            this.model = nextModel;

            for (const subscriber of this.subscribers) {
                subscriber(nextModel);
            }
        }

        return this.executeCmd(cmd);
    }

    private applyMsg(msg: AppMsg): Promise<Array<AppMsg>> {
        const [ nextModel, cmd ] = this.update(msg, this.model);

        return this.applyChanges(nextModel, cmd);
    }

    private applyBatchOfMsgs(msgs: Array<AppMsg>): Promise<Array<AppMsg>> {
        const result = msgs.reduce(
            (acc: { model: Model; cmds: Array<Cmd<AppMsg>> }, msg: AppMsg) => {
                const [ nextModel, cmd ] = this.update(msg, acc.model);

                return {
                    model: nextModel,
                    cmds: [ ...acc.cmds, cmd ]
                };
            },
            {
                model: this.model,
                cmds: []
            }
        );

        return this.applyChanges(result.model, Cmd.batch(result.cmds));
    }

    private executeCmd(cmd: Cmd<AppMsg>): Promise<Array<AppMsg>> {
        const result: Array<Promise<Array<AppMsg>>> = [];

        for (const promise of CmdInternal.execute(cmd)) {
            result.push(promise.then((msg: AppMsg) => this.applyMsg(msg)));
        }

        return Promise.all(result).then((arrayOfArrays: Array<Array<AppMsg>>): Array<AppMsg> => {
            return ([] as Array<AppMsg>).concat(...arrayOfArrays);
        });
    }

    private executeSub(sub: Sub<AppMsg>): void {
        const bags: Map<() => Router<AppMsg>, Array<Effect<AppMsg>>> = SubInternal.groupEffects(new Map(), sub);
        const groups: Array<[ Router<AppMsg>, Array<Effect<AppMsg>> ]> = [];

        for (const [ createRouter, oldRouter ] of this.routers) {
            groups.push([ oldRouter, bags.get(createRouter) || [] ]);
            bags.delete(createRouter);
        }

        for (const [ createRouter, effects ] of bags) {
            const newRouter = createRouter();

            groups.push([ newRouter, effects ]);
            this.routers.set(createRouter, newRouter);
        }

        for (const [ router, effects ] of groups) {
            const task = router.runEffects(
                <SelfMsg>(selfMsg: SelfMsg): Task<never, void> => TaskInternal.of(
                    (done: (task: Task<never, void>) => void): Process => {
                        done(
                            router.executeMsg(
                                (appMsgs: Array<AppMsg>): Task<never, void> => {
                                    this.applyBatchOfMsgs(appMsgs);

                                    return Task.succeed(undefined);
                                },
                                selfMsg
                            )
                        );

                        return ProcessInternal.none;
                    }
                ),
                effects
            );

            TaskInternal.execute(task);
        }
    }
}
