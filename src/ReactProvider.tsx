import React from 'react';

import { Cata, cons, identity } from 'frctl/Basics';
import { Program, Worker, Cmd, Sub, Task } from 'frctl';
import { Url } from 'frctl/Url';
import { Nothing, Just } from 'frctl/Maybe';

export class Key {
    public constructor(private readonly fire: () => void) {}

    public replace(path: string): Cmd<never> {
        return Task.binding((done: (task: Task<never, void>) => void) => {
            history.replaceState({}, '', path);
            this.fire();
            done(Task.succeed(undefined));
        }).perform(identity as never);
    }

    public push(path: string): Cmd<never> {
        return Task.binding((done: (task: Task<never, void>) => void) => {
            history.pushState({}, '', path);
            this.fire();
            done(Task.succeed(undefined));
        }).perform(identity as never);
    }
}

export interface UrlRequest {
    cata<R>(pattern: UrlRequest.Pattern<R>): R;
}

export namespace UrlRequest {
    export type Pattern<R> = Cata<{
        Internal(url: Url): R;
        External(url: string): R;
    }>;
}

export const Internal = cons<[ Url ], UrlRequest>(class Internal implements UrlRequest {
    public constructor(private readonly url: Url) {}

    public cata<R>(pattern: UrlRequest.Pattern<R>): R {
        return typeof pattern.Internal === 'function' ? pattern.Internal(this.url) : (pattern._ as () => R)();
    }
});

export const External = cons<[ string ], UrlRequest>(class External implements UrlRequest {
    public constructor(private readonly url: string) {}

    public cata<R>(pattern: UrlRequest.Pattern<R>): R {
        return typeof pattern.External === 'function' ? pattern.External(this.url) : (pattern._ as () => R)();
    }
});

export interface Props<Flags, Model, Msg> {
    flags: Flags;
    view: React.SFC<{
        model: Model;
        dispatch(msg: Msg): void;
    }>;
    init(flags: Flags, url: Url, key: Key): [ Model, Cmd<Msg> ];
    update(msg: Msg, model: Model): [ Model, Cmd<Msg> ];
    subscriptions(model: Model): Sub<Msg>;
    onUrlRequest(request: UrlRequest): Msg;
    onUrlChange(url: Url): Msg;
}

const getURL = (): Url => {
    return Url.fromString(document.location && document.location.href || '').getOrElse(null as never);
};

const FractalContext = React.createContext((_href: string): void => { /* empy */ });

export class ReactProvider<Flags, Model, Msg> extends React.PureComponent<Props<Flags, Model, Msg>, Model> {
    private mounted = false;
    private readonly worker: Worker<Model, Msg>;
    private unsubscribe?: () => void;
    private readonly dispatch: (msg: Msg) => void;
    private readonly key: Key;

    protected constructor(props: Props<Flags, Model, Msg>) {
        super(props);

        const fire = () => this.dispatch(props.onUrlChange(getURL()));

        this.key = new Key(fire);

        if (window.navigator.userAgent.indexOf('Trident') < 0) {
            window.addEventListener('hashchange', fire);
        }

        window.addEventListener('popstate', fire);

        this.worker = Program.worker({
            init: (flags: Flags) => props.init(flags, getURL(), this.key),
            update: props.update,
            subscriptions: props.subscriptions
        }).init(props.flags);

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
        const View = this.props.view;

        return (
            <FractalContext.Provider value={(href: string): void => {
                const current = getURL();

                return this.dispatch(this.props.onUrlRequest(
                    Url.fromString(href)
                        .chain(url => {
                            return current.protocol.isEqual(url.protocol)
                                && current.host === url.host
                                && current.port.isEqual(url.port)
                                ? Just(url)
                                : Nothing;
                        })
                        .map(Internal)
                        .getOrElse(External(href))
                ));
            }}>
                <View dispatch={this.dispatch} model={this.worker.getModel()} />
            </FractalContext.Provider>
        );
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

export const Link = (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <FractalContext.Consumer>{dispatch => (
        <a
            {...props}
            onClick={event => {
                dispatch(event.currentTarget.href);
                event.preventDefault();
            }}
        />
    )}</FractalContext.Consumer>
);
