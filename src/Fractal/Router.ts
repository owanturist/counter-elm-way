import {
    Process
} from './Process';
import {
    Task
} from './Task';
import {
    Cmd
} from './Platform/Cmd';
import {
    Sub
} from './Platform/Sub';

abstract class InternalProcess extends Process {
    public static get none(): Process {
        return super.none;
    }
}

abstract class InternalTask<E, T> extends Task<E, T> {
    public static of<E, T>(
        callback: (done: (task: Task<E, T>) => void) => Process
    ): Task<E, T> {
        return super.of(callback);
    }

    public static execute<E, T>(task: Task<E, T>): Promise<T> {
        return super.execute(task);
    }
}

abstract class InternalCmd<Msg> extends Cmd<Msg> {
    public static execute<Msg>(cmd: Cmd<Msg>): Array<Promise<Msg>> {
        return super.execute(cmd);
    }
}

abstract class InternalSub<Msg> extends Sub<Msg> {
    public static fromEffect<Msg>(effect: Effect<Msg>): Sub<Msg> {
        return super.fromEffect(effect);
    }

    public static toEffects<Msg>(sub: Sub<Msg>): Array<Effect<Msg>> {
        return super.toEffects(sub);
    }
}

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

export abstract class Effect<Msg> {
    public static fromSub<Msg>(sub: Sub<Msg>): Array<Effect<Msg>> {
        return InternalSub.toEffects(sub);
    }

    public abstract router: Router<Msg, unknown, unknown>;

    public abstract map<R>(fn: (msg: Msg) => R): Effect<R>;

    public toSub(): Sub<Msg> {
        return InternalSub.fromEffect(this);
    }
}

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
        return new Runtime(this.init_(flags), this.update, this.subscriptions);
    }
}

class Runtime<Model, Msg> {
    private routers: Map<Router<Msg, unknown, unknown>, unknown> = new Map();

    private model: Model;

    private readonly subscribers: Array<(model: Model) => void> = [];

    public constructor(
        [ initialModel, initialCmd ]: [ Model, Cmd<Msg> ],
        private readonly update: (msg: Msg, model: Model) => [ Model, Cmd<Msg> ],
        private readonly subscriptions: (model: Model) => Sub<Msg>
    ) {
        this.model = initialModel;

        this.executeCmd(initialCmd).then(() => {
            console.log('Initial Cmd has been done'); // tslint:disable-line:no-console
        });
    }

    private dispatch(msg: Msg): Promise<Array<Msg>> {
        const [ nextModel, cmd ] = this.update(msg, this.model);

        this.executeSub(this.subscriptions(nextModel));

        return this.applyChanges(nextModel, cmd);
    }

    private applyChanges(nextModel: Model, cmd: Cmd<Msg>): Promise<Array<Msg>> {
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

        for (const promise of InternalCmd.execute(cmd)) {
            result.push(promise.then((msg: Msg): Promise<Array<Msg>> => this.dispatch(msg)));
        }

        return Promise.all(result).then(
            (arrayOfArrays: Array<Array<Msg>>): Array<Msg> => ([] as Array<Msg>).concat(...arrayOfArrays)
        );
    }

    private executeSub(sub: Sub<Msg>): Promise<Array<void>> {
        const bags: Map<Router<Msg, unknown, unknown>, Array<Effect<Msg>>> = new Map();

        for (const effect of InternalSub.toEffects(sub)) {
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

        const result: Array<Promise<void>> = [];

        for (const [ router, state, effects ] of routers) {
            const task = router.onEffects(
                (selfMsg: unknown): Task<never, void> => {
                    return router.onSelfMsg(
                        (msg: Msg): Task<never, void> => InternalTask.of(
                            (done: (task: Task<never, void>) => void): Process => {
                                this.dispatch(msg).then(() => done(Task.succeed(undefined)));

                                return InternalProcess.none;
                            }
                        ),
                        selfMsg,
                        state
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

            result.push(InternalTask.execute(task));
        }

        return Promise.all(result);
    }
}
