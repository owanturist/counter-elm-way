import React from 'react';

import { Cata, cons } from 'frctl/Basics';
import { Program, Worker, Cmd, Sub, Task } from 'frctl';
import { Url } from 'frctl/Url';
import { Nothing, Just } from 'frctl/Maybe';

export interface Navigation {
    replaceUrl(url: string): Cmd<never>;

    pushUrl(url: string): Cmd<never>;

    back(steps: number): Cmd<never>;

    forward(steps: number): Cmd<never>;
}

class NavigationImpl implements Navigation {
    public constructor(private readonly onChange: () => void) {}

    public replaceUrl(url: string): Cmd<never> {
        return Task.binding(() => {
            history.replaceState({}, '', url);
            this.onChange();
        }).perform(null as never);
    }

    public pushUrl(url: string): Cmd<never> {
        return Task.binding(() => {
            history.pushState({}, '', url);
            this.onChange();
        }).perform(null as never);
    }

    public back(steps: number): Cmd<never> {
        return steps > 0 ? this.go(-steps) : Cmd.none;
    }

    public forward(steps: number): Cmd<never> {
        return steps > 0 ? this.go(steps) : Cmd.none;
    }

    private go(steps: number): Cmd<never> {
        return Task.binding(() => {
            if (steps !== 0) {
                history.go(steps);
            }

            this.onChange();
        }).perform(null as never);
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
    init(flags: Flags, url: Url, key: Navigation): [ Model, Cmd<Msg> ];
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
    private readonly navigation: Navigation;

    protected constructor(props: Props<Flags, Model, Msg>) {
        super(props);

        const onUrlChange = () => this.dispatch(props.onUrlChange(getURL()));

        this.navigation = new NavigationImpl(onUrlChange);

        if (window.navigator.userAgent.indexOf('Trident') < 0) {
            window.addEventListener('hashchange', onUrlChange);
        }

        window.addEventListener('popstate', onUrlChange);

        this.worker = Program.worker({
            init: (flags: Flags) => props.init(flags, getURL(), this.navigation),
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
