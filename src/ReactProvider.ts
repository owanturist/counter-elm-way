import React from 'react';

import {
    Program,
    Runtime,
    Cmd,
    Sub
} from 'frctl/src/__Internal__';


export interface Props<Flags, Model, Msg> {
    flags: Flags;
    view: React.SFC<{
        model: Model;
        dispatch(msg: Msg): void;
    }>;
    init(flags: Flags): [ Model, Cmd<Msg> ];
    update(msg: Msg, model: Model): [ Model, Cmd<Msg> ];
    subscriptions(model: Model): Sub<Msg>;
}

interface State<Model> {
    model: Model;
}

export class ReactProvider<Flags, Model, Msg> extends React.Component<Props<Flags, Model, Msg>, State<Model>> {
    private mounted = false;
    private runtime: Runtime<Model, Msg>;
    private unsubscribe?: () => void;
    private dispatch: (msg: Msg) => void;

    protected constructor(props: Props<Flags, Model, Msg>) {
        super(props);

        this.runtime = Program.worker({
            init: props.init,
            update: props.update,
            subscriptions: props.subscriptions
        }).init(props.flags);

        this.dispatch = (msg: Msg): void => this.runtime.dispatch(msg);

        this.state = {
            model: this.runtime.getModel()
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
            model: this.runtime.getModel()
        });
    }

    private subscribe(): void {
        this.unsubscribe = this.runtime.subscribe(() => {
            if (!this.mounted) {
                return;
            }

            const nextModel = this.runtime.getModel();

            this.setState((state: State<Model>): null | State<Model> => {
                return state.model === nextModel ? null : { model: nextModel };
            });
        });

        const postMountModel = this.runtime.getModel();

        if (postMountModel !== this.state.model) {
            this.setState({ model: postMountModel });
        }
    }
}
