import {
    Task
} from './Task';
import {
    Process
} from './Process';
import {
    Router,
    Effect
} from './Router';
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
    public static of<E, T>(create: (done: (task: Task<E, T>) => void) => Process): Task<E, T> {
        return super.of(create);
    }
}

abstract class InternalCmd<Msg> extends Cmd<Msg> {
    public static execute<Msg>(cmd: Cmd<Msg>): Array<Promise<Msg>> {
        return super.execute(cmd);
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
        return InternalRuntime.create(this.init_(flags), this.update, this.subscriptions);
    }
}

export class Runtime<Model, Msg> {
    protected static create<Model, Msg>(
        initials: [ Model, Cmd<Msg> ],
        update: (msg: Msg, model: Model) => [ Model, Cmd<Msg> ],
        subscriptions: (model: Model) => Sub<Msg>
    ): Runtime<Model, Msg> {
        return new Runtime(initials, update, subscriptions);
    }

    private routers: Map<Router<Msg, unknown, unknown>, unknown> = new Map();

    private model: Model;

    private readonly subscribers: Array<(model: Model) => void> = [];

    protected constructor(
        [ initialModel, initialCmd ]: [ Model, Cmd<Msg> ],
        private readonly update: (msg: Msg, model: Model) => [ Model, Cmd<Msg> ],
        private readonly subscriptions: (model: Model) => Sub<Msg>
    ) {
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

        for (const promise of InternalCmd.execute(cmd)) {
            result.push(promise.then((msg: Msg) => this.applyMsg(msg)));
        }

        return Promise.all(result).then((arrayOfArrays: Array<Array<Msg>>): Array<Msg> => {
            return ([] as Array<Msg>).concat(...arrayOfArrays);
        });
    }

    private executeSub(sub: Sub<Msg>): void {
        const bags: Map<Router<Msg, unknown, unknown>, Array<Effect<Msg>>> = new Map();

        for (const effect of Effect.fromSub(sub)) {
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

        for (const [ router, state, effects ] of routers) {
            const task = router.onEffects(
                (selfMsg: unknown): Task<never, void> => {
                    return router.onSelfMsg(
                        (msg: Msg): Task<never, void> => {
                            return InternalTask.of((done: (task: Task<never, void>) => void): Process => {
                                this.applyMsg(msg).then(() => done(Task.succeed(undefined)));

                                return InternalProcess.none;
                            });
                        },
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

            result.push(task);
        }
    }
}

abstract class InternalRuntime<Msg, Model> extends Runtime<Msg, Model> {
    public static create<Model, Msg>(
        initials: [ Model, Cmd<Msg> ],
        update: (msg: Msg, model: Model) => [ Model, Cmd<Msg> ],
        subscriptions: (model: Model) => Sub<Msg>
    ): Runtime<Model, Msg> {
        return super.create(initials, update, subscriptions);
    }
}
