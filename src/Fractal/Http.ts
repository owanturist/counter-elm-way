import {
    DefaultCase,
    WithDefaultCase
} from './Basics';
import {
    Maybe,
    Nothing,
    Just
} from './Maybe';
import {
    Either,
    Right
} from './Either';
import {
    Task
} from './Task';
import {
    Cmd
} from './Platform/Cmd';
import * as Decode from './Json/Decode';
import * as Encode from './Json/Encode';

abstract class InternalTask<E, T> extends Task<E, T> {
    public static of<E, T>(executor: (succeed: (value: T) => void, fail: (error: E) => void) => void): Task<E, T> {
        return Task.of(executor);
    }
}

const queryEscape = (str: string): string => encodeURIComponent(str).replace(/%20/g, '+');

const queryPair = ([ key, value ]: [ string, string ]): string => queryEscape(key) + '=' + queryEscape(value);

const buildUrlWithQuery = (url: string, queryParams: Array<[ string, string ]>): string => {
    if (queryParams.length === 0) {
        return url;
    }

    return url + '?' + queryParams.map(queryPair).join('&');
};

const parseHeaders = (rawHeaders: string): {[ name: string ]: string } => {
    const headers: {[ name: string ]: string } = {};

    if (!rawHeaders) {
        return headers;
    }

    const headerPairs = rawHeaders.split('\u000d\u000a');

    for (const headerPair of headerPairs) {
        const delimiterIndex = headerPair.indexOf('\u003a\u0020');

        if (delimiterIndex > 0) {
            const key = headerPair.substring(0, delimiterIndex);
            const value = headerPair.substring(delimiterIndex + 2);
            const oldValue = headers[ key ];

            headers[ key ] = oldValue ? value + ', ' + oldValue : value;
        }
    }

    return headers;
};

/* E R R O R */

export abstract class Error {
    public abstract cata<T>(pattern: Error.Pattern<T>): T;
}

export namespace Error {
    export type Pattern<T> = WithDefaultCase<{
        BadUrl(url: string): T;
        Timeout(): T;
        NetworkError(): T;
        BadStatus(response: Response<string>): T;
        BadPayload(error: Decode.Error, response: Response<string>): T;
    }, T>;

    export const BadUrl = (url: string): Error => {
        return new Internal.BadUrl(url);
    };

    export const Timeout = (): Error => {
        return new Internal.Timeout();
    };

    export const NetworkError = (): Error => {
        return new Internal.NetworkError();
    };

    export const BadStatus = (response: Response<string>): Error => {
        return new Internal.BadStatus(response);
    };

    export const BadPayload = (error: Decode.Error, response: Response<string>): Error => {
        return new Internal.BadPayload(error, response);
    };
}

namespace Internal {
    export class BadUrl extends Error {
        constructor(private readonly url: string) {
            super();
        }

        public cata<T>(pattern: Error.Pattern<T>): T {
            if (typeof pattern.BadUrl === 'function') {
                return pattern.BadUrl(this.url);
            }

            return (pattern as DefaultCase<T>)._();
        }
    }

    export class Timeout extends Error {
        public cata<T>(pattern: Error.Pattern<T>): T {
            if (typeof pattern.Timeout === 'function') {
                return pattern.Timeout();
            }

            return (pattern as DefaultCase<T>)._();
        }
    }

    export class NetworkError extends Error {
        public cata<T>(pattern: Error.Pattern<T>): T {
            if (typeof pattern.NetworkError === 'function') {
                return pattern.NetworkError();
            }

            return (pattern as DefaultCase<T>)._();
        }
    }

    export class BadStatus extends Error {
        constructor(private readonly response: Response<string>) {
            super();
        }

        public cata<T>(pattern: Error.Pattern<T>): T {
            if (typeof pattern.BadStatus === 'function') {
                return pattern.BadStatus(this.response);
            }

            return (pattern as DefaultCase<T>)._();
        }
    }

    export class BadPayload extends Error {
        constructor(
            private readonly error: Decode.Error,
            private readonly response: Response<string>
        ) {
            super();
        }

        public cata<T>(pattern: Error.Pattern<T>): T {
            if (typeof pattern.BadPayload === 'function') {
                return pattern.BadPayload(this.error, this.response);
            }

            return (pattern as DefaultCase<T>)._();
        }
    }
}

/* H E A D E R */

interface Header {
    name: string;
    value: string;
}

export const header = (name: string, value: string): Header => ({ name, value });

/* R E S P O N S E */

export interface Response<T> {
    url: string;
    status: {
        code: number;
        message: string;
    };
    headers: {[ name: string ]: string };
    body: T;
}

/* E X P E C T */

export interface Expect<T> {
    responseType: XMLHttpRequestResponseType;
    responseToResult(response: Response<string>): Either<Decode.Error, T>;
}

export const expectResponse = <T>(
    responseToResult: (response: Response<string>) => Either<Decode.Error, T>
): Expect<T> => ({
    responseType: 'text',
    responseToResult
});

export const expectString: Expect<string> = expectResponse(
    (response: Response<string>): Either<Decode.Error, string> => Right(response.body)
);

export const expectJson = <T>(decoder: Decode.Decoder<T>): Expect<T> => expectResponse(
    (response: Response<string>): Either<Decode.Error, T> => decoder.decodeJSON(response.body)
);

/* B O D Y */

interface BodyContent {
    type: string;
    value: string;
}

export abstract class Body {
    public abstract getContent(): Maybe<BodyContent>;
}

class EmptyBody extends Body {
    public getContent(): Maybe<BodyContent> {
        return Nothing();
    }
}

class StringBody extends Body {
    constructor(
        private readonly type: string,
        private readonly value: string
    ) {
        super();
    }

    public getContent(): Maybe<BodyContent> {
        return Just({
            type: this.type,
            value: this.value
        });
    }
}

export const emptyBody: Body = new EmptyBody();

export const stringBody = (type: string, value: string): Body => new StringBody(type, value);

export const jsonBody = (encoder: Encode.Encoder): Body => stringBody('application/json', encoder.encode(4));

/* R E Q U E S T */

const requestWithMethodAndUrl = (method: string, url: string): Request<string> => new Request(method, url, {
    headers: [],
    body: new EmptyBody(),
    expect: expectString,
    timeout: Nothing(),
    withCredentials: false,
    queryParams: []
});

export const get = (url: string): Request<string> => requestWithMethodAndUrl('GET', url);
export const post = (url: string): Request<string> => requestWithMethodAndUrl('GET', url);
export const put = (url: string): Request<string> => requestWithMethodAndUrl('PUT', url);
export const patch = (url: string): Request<string> => requestWithMethodAndUrl('PATCH', url);
export const del = (url: string): Request<string> => requestWithMethodAndUrl('DELETE', url);
export const options = (url: string): Request<string> => requestWithMethodAndUrl('OPTIONS', url);
export const trace = (url: string): Request<string> => requestWithMethodAndUrl('TRACE', url);
export const head = (url: string): Request<string> => requestWithMethodAndUrl('HEAD', url);

export class Request<T> {
    constructor(
        private readonly method: string,
        private readonly url: string,
        private readonly config: {
            headers: Array<Header>;
            body: Body;
            expect: Expect<T>;
            timeout: Maybe<number>;
            withCredentials: boolean;
            queryParams: Array<[string, string]>;
        }
    ) {}

    public withHeader(name: string, value: string): Request<T> {
        return new Request(this.method, this.url, {
            ...this.config,
            headers: [
                header(name, value),
                ...this.config.headers
            ]
        });
    }

    public withHeaders(headers: Array<Header>): Request<T> {
        return new Request(this.method, this.url, {
            ...this.config,
            headers: [
                ...headers,
                ...this.config.headers
            ]
        });
    }

    public withBody(body: Body): Request<T> {
        return new Request(this.method, this.url, {
            ...this.config,
            body
        });
    }

    public withStringBody(type: string, value: string): Request<T> {
        return this.withBody(stringBody(type, value));
    }

    public withJsonBody(encoder: Encode.Encoder): Request<T> {
        return this.withBody(jsonBody(encoder));
    }

    public withTimeout(timeout: number): Request<T> {
        return new Request(this.method, this.url, {
            ...this.config,
            timeout: Just(timeout)
        });
    }

    public withoutTimeout(): Request<T> {
        return new Request(this.method, this.url, {
            ...this.config,
            timeout: Nothing()
        });
    }

    public withCredentials(enabled: boolean): Request<T> {
        return new Request(this.method, this.url, {
            ...this.config,
            withCredentials: enabled
        });
    }

    public withQueryParam(key: string, value: string): Request<T> {
        return new Request(this.method, this.url, {
            ...this.config,
            queryParams: [
                [ key, value ],
                ...this.config.queryParams
            ]
        });
    }

    public withQueryParams(queries: Array<[ string, string ]>): Request<T> {
        return new Request(this.method, this.url, {
            ...this.config,
            queryParams: [
                ...queries,
                ...this.config.queryParams
            ]
        });
    }

    public withExpect<R>(expect: Expect<R>): Request<R> {
        return new Request(this.method, this.url, {
            ...this.config,
            expect
        });
    }

    public withExpectResponse<R>(
        responseToResult: (response: Response<string>) => Either<Decode.Error, R>
    ): Request<R> {
        return this.withExpect(expectResponse(responseToResult));
    }

    public withExpectString(): Request<string> {
        return this.withExpect(expectString);
    }

    public withExpectJson<R>(decoder: Decode.Decoder<R>): Request<R> {
        return this.withExpect(expectJson(decoder));
    }

    public toTask(): Task<Error, T> {
        return InternalTask.of((succeed: (value: T) => void, fail: (error: Error) => void): void => {
            const xhr = new XMLHttpRequest();

            xhr.addEventListener('error', () => {
                fail(Error.NetworkError());
            });

            xhr.addEventListener('timeout', () => {
                fail(Error.Timeout());
            });

            xhr.addEventListener('load', () => {
                const stringResponse: Response<string> = {
                    url: xhr.responseURL,
                    status: {
                        code: xhr.status,
                        message: xhr.statusText
                    },
                    headers: parseHeaders(xhr.getAllResponseHeaders()),
                    body: xhr.responseText
                };

                if (xhr.status < 200 || xhr.status >= 300) {
                    return fail(Error.BadStatus(stringResponse));
                }

                this.config.expect.responseToResult({
                    ...stringResponse,
                    body: xhr.response as string
                }).cata({
                    Left(decodeError: Decode.Error): void {
                        fail(Error.BadPayload(decodeError, stringResponse));
                    },

                    Right: succeed
                });
            });

            try {
                xhr.open(this.method, buildUrlWithQuery(this.url, this.config.queryParams), true);
            } catch (e) {
                return fail(Error.BadUrl(this.url));
            }

            for (const requestHeader of this.config.headers) {
                xhr.setRequestHeader(requestHeader.name, requestHeader.value);
            }

            xhr.responseType = this.config.expect.responseType;
            xhr.withCredentials = this.config.withCredentials;

            this.config.timeout.cata({
                Nothing(): void {
                    // do nothing
                },

                Just(timeout: number): void {
                    xhr.timeout = timeout;
                }
            });

            this.config.body.getContent().cata({
                Nothing(): void {
                    xhr.send();
                },

                Just({ type, value }: BodyContent): void {
                    xhr.setRequestHeader('Content-Type', type);
                    xhr.send(value);
                }
            });
        });
    }

    public send<R>(tagger: (result: Either<Error, T>) => R): Cmd<R> {
        return this.toTask().attempt(tagger);
    }
}
