/**
 * Solution based on:
 * @link https://github.com/redux-loop/redux-loop
 */
import React from 'react';

import {
    Cmd
} from 'Platform/Cmd';
import {
    Sub
} from 'Platform/Sub';

export interface Subscriber<Msg, T = any> {
    namespace: string;
    key: string;
    tagger(config: T): Msg;
    executor(callback: (config: T) => void): () => void;
}

interface Process<Msg, T = any> {
    mailbox: Array<(config: T) => Msg>;
    kill(): void;
}

abstract class InternalCmd<Msg> extends Cmd<Msg> {
    public static execute<Msg, R>(fn: (msg: Msg) => R, cmd: Cmd<Msg>): Promise<any> {
        return Cmd.execute(fn, cmd);
    }
}

abstract class InternalSub<Msg> extends Sub<Msg> {
    public static configure<Msg>(sub: Sub<Msg>): Array<Subscriber<Msg>> {
        return Sub.configure(sub);
    }
}

export type Dispatch<Msg> = (msg: Msg) => void;

export interface Configuration<Msg, Model> {
    view: React.StatelessComponent<{
        dispatch: Dispatch<Msg>;
        model: Model;
    }>;
    init(): [ Model, Cmd<Msg> ];
    update(msg: Msg, model: Model): [ Model, Cmd<Msg> ];
    subscriptions(model: Model): Sub<Msg>;
}

export class Application<Msg, Model> extends React.Component<Configuration<Msg, Model>, Model> {
    private readonly processes: Map<string, Map<string, Process<Msg>>> = new Map();

    constructor(props: Configuration<Msg, Model>, context: any) {
        super(props, context);

        const [ initialModel, initialCmd ] = props.init();

        this.state = initialModel;
        InternalCmd.execute(this.dispatch, initialCmd);
    }

    public render() {
        return React.createElement(
            this.props.view,
            {
                model: this.state,
                dispatch: (msg: Msg): void => {
                    this.dispatch(msg);
                }
            }
        );
    }

    private applyChanges(nextModel: Model, cmd: Cmd<Msg>): Promise<any> {
        if (this.state !== nextModel) {
            this.setState(nextModel);
        }

        this.manageSubscribers(
            InternalSub.configure(this.props.subscriptions(nextModel))
        );

        return InternalCmd.execute(this.dispatch, cmd);
    }

    private readonly dispatch = (msg: Msg): Promise<any> => {
        const [ nextModel, cmd ] = this.props.update(msg, this.state);

        return this.applyChanges(nextModel, cmd);
    }

    private sequence(msgs: Array<Msg>): Promise<any> {
        if (msgs.length === 0) {
            return Promise.resolve();
        }

        let nextModel: Model = this.state;
        const cmds: Array<Cmd<Msg>> = [];

        for (const msg of msgs) {
            const [ model, cmd ] = this.props.update(msg, nextModel);

            nextModel = model;
            cmds.push(cmd);
        }

        return this.applyChanges(nextModel, Cmd.batch(cmds));
    }

    private readonly manageSubscribers = (subscribers: Array<Subscriber<Msg>>): void => {
        const nextProcessess: Map<string, Map<string, {
            mailbox: Array<(config: any) => Msg>;
            executor(callback: (config: any) => void): () => void;
        }>> = new Map();

        for (const subscriber of subscribers) {
            const bag = nextProcessess.get(subscriber.namespace) || new Map();
            const process = bag.get(subscriber.key) || {
                mailbox: [],
                executor: subscriber.executor
            };

            process.mailbox.push(subscriber.tagger);

            if (!bag.has(subscriber.key)) {
                bag.set(subscriber.key, process);
            }

            if (!nextProcessess.has(subscriber.namespace)) {
                nextProcessess.set(subscriber.namespace, bag);
            }
        }

        for (const [ namespace, bag ] of this.processes) {
            const nextBag = nextProcessess.get(namespace);

            if (nextBag) {
                for (const [ key, process ] of bag) {
                    const nextProcess = nextBag.get(key);

                    if (nextProcess) {
                        process.mailbox = nextProcess.mailbox;
                        nextBag.delete(key);
                    } else {
                        process.kill();
                        bag.delete(key);
                    }
                }

            } else {
                for (const [ key, process ] of bag) {
                    process.kill();
                    bag.delete(key);
                }

                this.processes.delete(namespace);
            }
        }

        for (const [ namespace, newBag ] of nextProcessess) {
            const bag = this.processes.get(namespace) || new Map();

            for (const [ key, processCreator ] of newBag) {
                const newProcess = {
                    mailbox: processCreator.mailbox,
                    kill: processCreator.executor(
                        (config: any): void => {
                            const msgs: Array<Msg> = [];

                            for (const letter of newProcess.mailbox) {
                                msgs.push(letter(config));
                            }

                            this.sequence(msgs);
                        }
                    )
                };

                bag.set(key, newProcess);
            }

            if (!this.processes.has(namespace)) {
                this.processes.set(namespace, bag);
            }
        }
    }
}
