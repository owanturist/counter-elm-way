import React from 'react';

import {
    Program,
    Cmd,
    Sub
} from 'frctl/dist/Core';

export interface Props<Model, Msg> {
    view: React.SFC<{
        model: Model;
        dispatch(msg: Msg): void;
    }>;
    init(): [ Model, Cmd<Msg> ];
    update(msg: Msg, model: Model): [ Model, Cmd<Msg> ];
    subscriptions(model: Model): Sub<Msg>;
}


export class ReactProvider<Model, Msg> extends React.PureComponent<Props<Model, Msg>, Model> {
    private mounted = false;
    private worker: Program<Model, Msg>;
    private unsubscribe?: () => void;
    private dispatch: (msg: Msg) => void;

    protected constructor(props: Props<Model, Msg>) {
        super(props);

        this.worker = Program.worker({
            init: props.init,
            update: props.update,
            subscriptions: props.subscriptions
        });

        this.dispatch = (msg: Msg): void => this.worker.dispatch(msg);

        this.state = this.worker.getModel();
    }

    public componentDidMount() {
        this.mounted = true;
        this.subscribe();
    }

    public componentWillUnmount() {
        if (typeof this.unsubscribe === 'function') {
            this.unsubscribe();
        }

        this.mounted = false;
    }

    public render(): React.ReactNode {
        return React.createElement(this.props.view, {
            dispatch: this.dispatch,
            model: this.worker.getModel()
        });
    }

    private subscribe(): void {
        this.unsubscribe = this.worker.subscribe(() => {
            if (!this.mounted) {
                return;
            }

            this.setState(this.worker.getModel());
        });

        this.setState(this.worker.getModel());
    }
}
