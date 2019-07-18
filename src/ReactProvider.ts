import React from 'react';

import {
    Worker,
    Program,
    Cmd,
    Sub
} from 'frctl/src/Core';


export interface Props<Flags, Model, Msg> {
    flags?: Flags;
    view: React.SFC<{
        model: Model;
        dispatch(msg: Msg): void;
    }>;
    init(): [ Model, Cmd<Msg> ];
    update(msg: Msg, model: Model): [ Model, Cmd<Msg> ];
    subscriptions(model: Model): Sub<Msg>;
}

interface State<Model> {
    model: Model;
}

export class ReactProvider<Flags, Model, Msg> extends React.PureComponent<Props<Flags, Model, Msg>, State<Model>> {
    private mounted = false;
    private worker: Worker<Model, Msg>;
    private unsubscribe?: () => void;
    private dispatch: (msg: Msg) => void;

    protected constructor(props: Props<Flags, Model, Msg>) {
        super(props);

        this.worker = Program.worker<Flags | undefined, Model, Msg>({
            init: props.init,
            update: props.update,
            subscriptions: props.subscriptions
        }).init(props.flags);

        this.dispatch = (msg: Msg): void => this.worker.dispatch(msg);

        this.state = {
            model: this.worker.getModel()
        };
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

            const nextModel = this.worker.getModel();

            this.setState((state: State<Model>): null | State<Model> => {
                return state.model === nextModel ? null : { model: nextModel };
            });
        });

        const postMountModel = this.worker.getModel();

        if (postMountModel !== this.state.model) {
            this.setState({ model: postMountModel });
        }
    }
}
