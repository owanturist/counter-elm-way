import React from 'react';

import {
    Cmd
} from 'frctl/Dist/Platform/Cmd';
import {
    RemoteData,
    Loading,
} from 'frctl/Dist/RemoteData';
import {
    Either
} from 'frctl/Dist/Either';
import * as Http from 'frctl/Dist/Http';
import * as Decode from 'frctl/Dist/Json/Decode';

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

const fetchPeopleById = (peopleId: string): Cmd<Msg> => {
    return Http.get('https://swapi.co/api/people/' + peopleId)
        .withExpectJson(peopleDecoder)
        // .toTask()
        // .spawn()
        // .chain((process: Process): Task<never, void> => process.kill())
        // .perform((): Msg => ({ $: 'FETCH_CANCEL' }));
        .send(response => new FetchDone(response));
};

export interface Model {
    id: string;
    person: RemoteData<Http.Error, Person>;
}

export const init = (peopleId: string): [ Model, Cmd<Msg> ] => [
    {
        id: peopleId,
        person: Loading
    },
    fetchPeopleById(peopleId)
];

export interface Msg {
    update(model: Model): [ Model, Cmd<Msg> ];
}

class Fetch {
    public update(model: Model): [ Model, Cmd<Msg> ] {
        return [
            {
                ...model,
                person: Loading
            },
            fetchPeopleById(model.id)
        ];
    }
}

class FetchDone {
    public constructor(private readonly result: Either<Http.Error, Person>) {}

    public update(model: Model): [ Model, Cmd<Msg> ] {
        return [
            {
                ...model,
                person: RemoteData.fromEither(this.result)
            },
            Cmd.none
        ];
    }
}

export const View: React.StatelessComponent<{
    model: Model;
    dispatch(msg: Msg): void;
}> = ({ dispatch, model }) => (
    <div>
        {model.person.cata({
            NotAsked: () => (
                <h1>Not Asked. <button onClick={() => dispatch(new Fetch())}>Click for ask</button></h1>
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
                            onClick={() => dispatch(new Fetch())}
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
