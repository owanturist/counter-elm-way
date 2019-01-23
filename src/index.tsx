import React from 'react';
import {
    render
} from 'react-dom';

import {
    Program,
    Runtime
} from 'Fractal/Platform';
import {
    Cmd
} from 'Fractal/Platform/Cmd';
import {
    Sub
} from 'Fractal/Platform/Sub';

import * as App from 'App';

interface Props<Flags, Model, Msg> {
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

class Provider<Flags, Model, Msg> extends React.Component<Props<Flags, Model, Msg>, State<Model>> {
    private mounted = false;
    private runtime: Runtime<Model, Msg>;
    private unsubscribe?: () => void;

    protected constructor(props: Props<Flags, Model, Msg>) {
        super(props);

        this.runtime = Program.worker({
            init: props.init,
            update: props.update,
            subscriptions: props.subscriptions
        }).init(props.flags);

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
            dispatch: this.runtime.dispatch,
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

render(
    (
        <Provider
            flags={null}
            init={App.init}
            update={App.update}
            subscriptions={App.subscriptions}
            view={App.View}
        />
    ),
    document.getElementById('app')
);
