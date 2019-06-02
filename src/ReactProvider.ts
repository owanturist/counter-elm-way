import React from 'react';

import {
    Program,
    Cmd,
    Sub
} from 'frctl/src/Core';


export interface Props<Model, Msg> {
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

export class ReactProvider<Model, Msg> extends React.Component<Props<Model, Msg>, State<Model>> {
    private mounted = false;
    private program: Program<Model, Msg>;
    private unsubscribe?: () => void;
    private dispatch: (msg: Msg) => void;

    protected constructor(props: Props<Model, Msg>) {
        super(props);

        this.program = Program.worker({
            init: props.init,
            update: props.update,
            subscriptions: props.subscriptions
        });

        this.dispatch = (msg: Msg): void => this.program.dispatch(msg);

        this.state = {
            model: this.program.getModel()
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
            model: this.program.getModel()
        });
    }

    private subscribe(): void {
        this.unsubscribe = this.program.subscribe(() => {
            if (!this.mounted) {
                return;
            }

            const nextModel = this.program.getModel();

            this.setState((state: State<Model>): null | State<Model> => {
                return state.model === nextModel ? null : { model: nextModel };
            });
        });

        const postMountModel = this.program.getModel();

        if (postMountModel !== this.state.model) {
            this.setState({ model: postMountModel });
        }
    }
}
