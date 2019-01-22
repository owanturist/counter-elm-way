import {
    Task
} from './Task';
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

abstract class InternalTask<E, T> extends Task<E, T> {
    public static execute<E, T>(task: Task<E, T>): Promise<T> {
        return super.execute(task);
    }
}

abstract class InternalCmd<Msg> extends Cmd<Msg> {
    public static execute<Msg>(cmd: Cmd<Msg>): Array<Task<never, Msg>> {
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

class Runtime<Model, Msg> {
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

        Promise.all([
            InternalTask.execute(this.executeCmd(initialCmd)),
            InternalTask.execute(this.executeSub(subscriptions(initialModel)))
        ]).then(() => {
            console.log('Initial Cmd and Sub have been done'); // tslint:disable-line:no-console
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

    private applyMsg(msg: Msg): Task<never, Array<Msg>> {
        const [ nextModel, cmd ] = this.update(msg, this.model);

        InternalTask.execute(this.executeSub(this.subscriptions(nextModel)));

        if (this.model !== nextModel) {
            this.model = nextModel;

            for (const subscriber of this.subscribers) {
                subscriber(nextModel);
            }
        }

        return this.executeCmd(cmd);
    }

    private executeCmd(cmd: Cmd<Msg>): Task<never, Array<Msg>> {
        const result: Array<Task<never, Array<Msg>>> = [];

        for (const task of InternalCmd.execute(cmd)) {
            result.push(task.chain((msg: Msg): Task<never, Array<Msg>> => this.applyMsg(msg)));
        }

        return Task.sequence(result).map(
            (arrayOfArrays: Array<Array<Msg>>): Array<Msg> => ([] as Array<Msg>).concat(...arrayOfArrays)
        );
    }

    private executeSub(sub: Sub<Msg>): Task<never, Array<void>> {
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
                        (msg: Msg): Task<never, void> => this.applyMsg(msg).map(() => undefined),
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

        return Task.sequence(result);
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
