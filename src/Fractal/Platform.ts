/**
 * Solution based on:
 * @link https://github.com/redux-loop/redux-loop
 */
import React from 'react';

import {
    Cmd
} from './Platform/Cmd';
import {
    Sub
} from './Platform/Sub';

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

interface Mailbox<Msg, T> {
    mailbox: Array<(config: T) => Msg>;
    executor(callback: (config: T) => void): () => void;
}

abstract class InternalCmd<Msg> extends Cmd<Msg> {
    public static execute<Msg>(cmd: Cmd<Msg>): Array<Promise<Msg>> {
        return super.execute(cmd);
    }
}

abstract class InternalSub<Msg> extends Sub<Msg> {
    public static configure<Msg, T>(sub: Sub<Msg>): Array<Subscriber<Msg, T>> {
        return super.configure(sub);
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

        this.executeCmd(initialCmd).then(() => {
            console.log('Initial Cmd has been done'); // tslint:disable-line:no-console
        });
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

    private executeCmd(cmd: Cmd<Msg>): Promise<Array<Msg>> {
        const result: Array<Promise<Array<Msg>>> = [];

        for (const promise of InternalCmd.execute(cmd)) {
            result.push(promise.then(this.dispatch));
        }

        return Promise.all(result).then((arrayOfArrays: Array<Array<Msg>>): Array<Msg> => {
            const result: Array<Msg> = [];

            for (const arrayOfMsgs of arrayOfArrays) {
                result.push(...arrayOfMsgs);
            }

            return result;
        });
    }

    private applyChanges(nextModel: Model, cmd: Cmd<Msg>): Promise<Array<Msg>> {
        if (this.state !== nextModel) {
            this.setState(nextModel);
        }

        this.executeSub(this.props.subscriptions(nextModel));

        return this.executeCmd(cmd);
    }

    private readonly dispatch = (msg: Msg): Promise<Array<Msg>> => {
        const [ nextModel, cmd ] = this.props.update(msg, this.state);

        return this.applyChanges(nextModel, cmd);
    }

    private sequence(msgs: Array<Msg>): Promise<Array<Msg>> {
        if (msgs.length === 0) {
            return Promise.resolve([]);
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

    private executeSub<T>(sub: Sub<Msg>): void {
        const nextProcessess: Map<string, Map<string, Mailbox<Msg, T>>> = new Map();

        for (const subscriber of InternalSub.configure<Msg, T>(sub)) {
            const bag = nextProcessess.get(subscriber.namespace) || new Map();
            const process: Mailbox<Msg, T> = bag.get(subscriber.key) || {
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
                        (config: T): void => {
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
