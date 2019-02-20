import React from 'react';

import {
    Cmd
} from 'Fractal/Platform/Cmd';
import {
    RemoteData,
    NotAsked,
    Loading,
} from 'Fractal/RemoteData';
import {
    Either
} from 'Fractal/Either';
import * as Http from 'Fractal/Http';
import * as Decode from 'Fractal/Json/Decode';

interface Person {
    name: string;
    height: string;
    mass: string;
}

const peopleDecoder: Decode.Decoder<Person> = Decode.props({
    name: Decode.field('name', Decode.string),
    height: Decode.field('height', Decode.string),
    mass: Decode.field('mass', Decode.string)
});

export type Msg
    = { $: 'FETCH' }
    | { $: 'FETCH_DONE'; _0: Either<Http.Error, Person> }
    | { $: 'FETCH_CANCEL' }
    ;

export interface Model {
    id: string;
    person: RemoteData<Http.Error, Person>;
}

const fetchPeopleById = (peopleId: string): Cmd<Msg> => {
    return Http.get('https://swapi.co/api/people/' + peopleId)
        .withExpectJson(peopleDecoder)
        // .toTask()
        // .spawn()
        // .chain((process: Process): Task<never, void> => process.kill())
        // .perform((): Msg => ({ $: 'FETCH_CANCEL' }));
        .send((response: Either<Http.Error, Person>): Msg => ({ $: 'FETCH_DONE', _0: response }));
};

export const init = (peopleId: string): [ Model, Cmd<Msg> ] => [
    {
        id: peopleId,
        person: Loading
    },
    fetchPeopleById(peopleId)
];

export const update = (msg: Msg, model: Model): [ Model, Cmd<Msg> ] => {
    switch (msg.$) {
        case 'FETCH': {
            return [
                {
                    ...model,
                    person: Loading
                },
                fetchPeopleById(model.id)
            ];
        }

        case 'FETCH_DONE': {
            return [
                {
                    ...model,
                    person: RemoteData.fromEither(msg._0)
                },
                Cmd.none
            ];
        }

        case 'FETCH_CANCEL': {
            return [
                {
                    ...model,
                    person: NotAsked
                },
                Cmd.none
            ];
        }
    }
};

export const View = ({ dispatch, model }: {
    model: Model;
    dispatch(msg: Msg): void;
}): JSX.Element => (
    <div>
        {model.person.cata({
            NotAsked: () => (
                <h1>Not Asked. <button onClick={() => dispatch({ $: 'FETCH' })}>Click for ask</button></h1>
            ),

            Loading: () => (
                <h1>Loading...</h1>
            ),

            Failure: (error: Http.Error) => error.cata({
                BadUrl: (url: string) => (
                    <h1>Url is bad <code>{url}</code></h1>
                ),

                Timeout: () => (
                    <h1>Response fail by timeout</h1>
                ),

                NetworkError: () => (
                    <h1>Network error, check your connection</h1>
                ),

                BadStatus: () => (
                    <div>
                        <h1>Error at server side</h1>
                        <button
                            onClick={() => dispatch({ $: 'FETCH' })}
                        >Fetch again</button>
                    </div>
                ),

                BadBody: (decodeError: Decode.Error) => (
                    <div>
                        <h1>Error with data</h1>
                        <code>{decodeError.stringify(4)}</code>
                    </div>
                )
            }),

            Succeed: (person: Person) => (
                <div>
                    <h1>{person.name}</h1>
                    <div>Height: <code>{person.height}</code></div>
                    <div>Mass: <code>{person.mass}</code></div>
                </div>
            )
        }
    )}
    </div>
);
