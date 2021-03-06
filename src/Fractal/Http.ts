import {
    Cata
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

/* H E L P E R S */

const noop = () => {
    // do nothing
};

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

/* T A S K */

abstract class InternalTask<E, T> extends Task<E, T> {
    public static of<E, T>(executor: (fail: (error: E) => void, succeed: (value: T) => void) => void): Task<E, T> {
        return super.of(executor);
    }
}

/* E R R O R */

export abstract class Error {
    public abstract cata<T>(pattern: Error.Pattern<T>): T;
}

namespace Errors {
    export class BadUrl extends Error {
        constructor(private readonly url: string) {
            super();
        }

        public cata<T>(pattern: Error.Pattern<T>): T {
            if (typeof pattern.BadUrl === 'function') {
                return pattern.BadUrl(this.url);
            }

            return (pattern._ as () => T)();
        }
    }

    export class Timeout extends Error {
        public cata<T>(pattern: Error.Pattern<T>): T {
            if (typeof pattern.Timeout === 'function') {
                return pattern.Timeout();
            }

            return (pattern._ as () => T)();
        }
    }

    export class NetworkError extends Error {
        public cata<T>(pattern: Error.Pattern<T>): T {
            if (typeof pattern.NetworkError === 'function') {
                return pattern.NetworkError();
            }

            return (pattern._ as () => T)();
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

            return (pattern._ as () => T)();
        }
    }

    export class BadBody extends Error {
        constructor(
            private readonly error: Decode.Error,
            private readonly response: Response<string>
        ) {
            super();
        }

        public cata<T>(pattern: Error.Pattern<T>): T {
            if (typeof pattern.BadBody === 'function') {
                return pattern.BadBody(this.error, this.response);
            }

            return (pattern._ as () => T)();
        }
    }
}

export namespace Error {
    export type Pattern<T> = Cata<{
        BadUrl(url: string): T;
        Timeout(): T;
        NetworkError(): T;
        BadStatus(response: Response<string>): T;
        BadBody(error: Decode.Error, response: Response<string>): T;
    }>;

    export const BadUrl = (url: string): Error => {
        return new Errors.BadUrl(url);
    };

    export const Timeout: Error = new Errors.Timeout();

    export const NetworkError: Error = new Errors.NetworkError();

    export const BadStatus = (response: Response<string>): Error => {
        return new Errors.BadStatus(response);
    };

    export const BadBody = (error: Decode.Error, response: Response<string>): Error => {
        return new Errors.BadBody(error, response);
    };
}

/* H E A D E R */

export class Header {
    protected constructor(
        protected readonly name: string,
        protected readonly value: string
    ) {}
}

abstract class PhantomHeader extends Header {
    public static of(name: string, value: string): Header {
        return new Header(name, value);
    }

    public static getName(header: PhantomHeader): string {
        return header.name;
    }

    public static getValue(header: PhantomHeader): string {
        return header.value;
    }
}

export const header = PhantomHeader.of;

/* R E S P O N S E */

export interface Response<T> {
    readonly url: string;
    readonly statusCode: number;
    readonly statusText: string;
    readonly headers: {[ name: string ]: string };
    readonly body: T;
}

/* E X P E C T */

export class Expect<T> {
    protected constructor(
        protected readonly responseType: XMLHttpRequestResponseType,
        protected readonly responseToResult: (response: Response<string>) => Either<Decode.Error, T>
    ) {}
}

abstract class PhantomExpect<T> extends Expect<T> {
    public static of<T>(
        responseType: XMLHttpRequestResponseType,
        responseToResult: (response: Response<string>) => Either<Decode.Error, T>
    ): Expect<T> {
        return new Expect(responseType, responseToResult);
    }

    public static getType<T>(expect: PhantomExpect<T>): XMLHttpRequestResponseType {
        return expect.responseType;
    }

    public static toResult<T>(response: Response<string>, expect: PhantomExpect<T>): Either<Decode.Error, T> {
        return expect.responseToResult(response);
    }
}

export const expectResponse = <T>(
    responseToResult: (response: Response<string>) => Either<Decode.Error, T>
): Expect<T> => PhantomExpect.of('text', responseToResult);

export const expectWhatever: Expect<void> = expectResponse(
    (): Either<Decode.Error, void> => Right(undefined)
);

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

export class Body {
    protected constructor(
        protected readonly content: Maybe<BodyContent>
    ) {}
}

abstract class PhantomBody extends Body {
    public static of(content: Maybe<BodyContent>): Body {
        return new Body(content);
    }

    public static getContent(body: PhantomBody): Maybe<BodyContent> {
        return body.content;
    }
}

export const emptyBody: Body = PhantomBody.of(Nothing);

export const stringBody = (type: string, value: string): Body => PhantomBody.of(Just({ type, value }));

export const jsonBody = (encoder: Encode.Encoder): Body => stringBody('application/json', encoder.encode(4));

/* R E Q U E S T */

export class Request<T> {
    protected constructor(private readonly config: Readonly<{
        method: string;
        url: string;
        headers: Array<Header>;
        body: Body;
        expect: Expect<T>;
        timeout: Maybe<number>;
        withCredentials: boolean;
        queryParams: Array<[ string, string ]>;
    }>) {}

    public withHeader(name: string, value: string): Request<T> {
        return this.withHeaders([ header(name, value) ]);
    }

    public withHeaders(headers: Array<Header>): Request<T> {
        return new Request({
            ...this.config,
            headers: [
                ...headers,
                ...this.config.headers
            ]
        });
    }

    public withBody(body: Body): Request<T> {
        return new Request({
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
        return new Request({
            ...this.config,
            timeout: Just(timeout)
        });
    }

    public withoutTimeout(): Request<T> {
        return new Request({
            ...this.config,
            timeout: Nothing
        });
    }

    public withCredentials(enabled: boolean): Request<T> {
        return new Request({
            ...this.config,
            withCredentials: enabled
        });
    }

    public withQueryParam(key: string, value: string): Request<T> {
        return new Request({
            ...this.config,
            queryParams: [
                [ key, value ],
                ...this.config.queryParams
            ]
        });
    }

    public withQueryParams(queries: Array<[ string, string ]>): Request<T> {
        return new Request({
            ...this.config,
            queryParams: [
                ...queries,
                ...this.config.queryParams
            ]
        });
    }

    public withExpect<R>(expect: Expect<R>): Request<R> {
        return new Request({
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

    public toCancelableTask(): [ Task<never, void>, Task<Error, T> ] {
        let abortRequest = noop;

        return [
            InternalTask.of((_fail: (error: never) => void, succeed: (value: void) => void): void => {
                abortRequest();

                succeed(undefined);
            }),
            InternalTask.of((fail: (error: Error) => void, succeed: (value: T) => void): void => {
                const xhr = new XMLHttpRequest();

                xhr.addEventListener('error', () => {
                    abortRequest = noop;
                    fail(Error.NetworkError);
                });

                xhr.addEventListener('timeout', () => {
                    abortRequest = noop;
                    fail(Error.Timeout);
                });

                xhr.addEventListener('load', () => {
                    abortRequest = noop;

                    const stringResponse: Response<string> = {
                        url: xhr.responseURL,
                        statusCode: xhr.status,
                        statusText: xhr.statusText,
                        headers: parseHeaders(xhr.getAllResponseHeaders()),
                        body: xhr.responseText
                    };

                    if (xhr.status < 200 || xhr.status >= 300) {
                        return fail(Error.BadStatus(stringResponse));
                    }

                    PhantomExpect.toResult({
                        ...stringResponse,
                        body: xhr.response as string
                    }, this.config.expect).cata({
                        Left(decodeError: Decode.Error): void {
                            fail(Error.BadBody(decodeError, stringResponse));
                        },

                        Right: succeed
                    });
                });

                try {
                    xhr.open(this.config.method, buildUrlWithQuery(this.config.url, this.config.queryParams), true);
                } catch (e) {
                    return fail(Error.BadUrl(this.config.url));
                }

                for (const requestHeader of this.config.headers) {
                    xhr.setRequestHeader(
                        PhantomHeader.getName(requestHeader),
                        PhantomHeader.getValue(requestHeader)
                    );
                }

                xhr.responseType = PhantomExpect.getType(this.config.expect);
                xhr.withCredentials = this.config.withCredentials;

                this.config.timeout.cata({
                    Nothing(): void {
                        // do nothing
                    },

                    Just(timeout: number): void {
                        xhr.timeout = timeout;
                    }
                });

                PhantomBody.getContent(this.config.body).cata({
                    Nothing(): void {
                        xhr.send();
                    },

                    Just({ type, value }: BodyContent): void {
                        xhr.setRequestHeader('Content-Type', type);
                        xhr.send(value);
                    }
                });

                abortRequest = () => {
                    xhr.abort();
                };
            })
        ];
    }

    public toTask(): Task<Error, T> {
        const [ , task ] = this.toCancelableTask();

        return task;
    }

    public send<R>(tagger: (result: Either<Error, T>) => R): Cmd<R> {
        return this.toTask().attempt(tagger);
    }
}

abstract class PhantomRequest<T> extends Request<T> {
    public static of(method: string, url: string): Request<void> {
        return new Request({
            method,
            url,
            headers: [],
            body: emptyBody,
            expect: expectWhatever,
            timeout: Nothing,
            withCredentials: false,
            queryParams: []
        });
    }
}

export const get     = (url: string): Request<void> => PhantomRequest.of('GET', url);
export const post    = (url: string): Request<void> => PhantomRequest.of('GET', url);
export const put     = (url: string): Request<void> => PhantomRequest.of('PUT', url);
export const patch   = (url: string): Request<void> => PhantomRequest.of('PATCH', url);
export const del     = (url: string): Request<void> => PhantomRequest.of('DELETE', url);
export const options = (url: string): Request<void> => PhantomRequest.of('OPTIONS', url);
export const trace   = (url: string): Request<void> => PhantomRequest.of('TRACE', url);
export const head    = (url: string): Request<void> => PhantomRequest.of('HEAD', url);
