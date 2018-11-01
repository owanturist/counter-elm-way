# Currency Exchanger App

It is a small React application which wrote by [Elm][elm-lang] way.

The source of FX rates is [exchangeratesapi.io][exchangeratesapi.io].

Implementation of the Elm architecture is placed right here in [Fractal](/src/Fractal) folder.
You can find the source of some functors such as
`Maybe`, `Either`, `Json/Decode` and `Json/Encode` [here][owanturist-maybe].

Code of `Fractal` is partial adaptation of Elm's packages:
  - [elm-core][elm-core]
  - [elm-json][elm-json]
  - [elm-time][elm-time]
  - [elm-remote-data][elm-remote-data]

## Requirements
- [node][node-install] (recommended install by [nvm][nvm-install])
  > look minimal node version in `package.json`

## Installation
```bash
npm install
```

## Developing
```bash
npm dev
```

Open [localhost:3000](http://localhost:3000/) in your browser.
Open `{your_id}:3000` from another devices which plased in the same local network.

## Advantages

1. Encapsulation. No one parent component know nothing about `Msg`, it can just call `update`.
1. No more huge `update`/`reducer` function - whole logic is described inside the source.
It's very natural to define a `Msg` (or `Action` if you wish) and describe handling right there.
1. Easy track of unused `Msg`. Otherwise you use deescribed `type Msg` at least in one place: 
`update`/`reducer` and even you use one of ten `Msg` in a component but the function will 
always use all of them.
1. No more overhead with types:
```ts
export type Model = Readonly<{
    count: number;
}>;

/**
 * REDUX WAY
 *
 * Call it like `dispatch(decrement(2))` or
 * `dispatch({ type: Decrement, amount: 2 })` if you too lazy to describe shortcuts
 * whenever and wherever you need. The second cause describe extra type sometimes.
 */

type Decrement = '@Counter/Decrement';
const Decrement: Decrement = '@Counter/Decrement';

type Increment = '@Counter/Increment';
const Increment: Increment = '@Counter/Increment';

type Reset = '@Counter/Reset';
const Reset: Reset = '@Counter/Reset';

// Everyone outside knows about signature of your Msg now.
export type Msg
    = Readonly<{ type: Decrement; amount: number }>
    | Readonly<{ type: Increment; amount: number }>
    | Readonly<{ type: Reset }>
    ;

const decrement = (amount: number): Msg => ({ type: Decrement, amount });
const increment = (amount: number): Msg => ({ type: Increment, amount });
const reset: Msg = { type: Reset };

export const update = (msg: Msg, model: Model): Model => {
    switch (msg.type) {
        case Decrement: {
            return { ...model, count: model.count + msg.amount };
        }

        case Increment: {
            return { ...model, count: model.count + msg.amount };
        }

        case Reset: {
            return { ...model, count: 0 };
        }
    }
};

/**
 * CLASS WAY
 *
 * Call it like `dispatch(new Decrement(2))` whenever and wherever you need
 */

// Nobody outisde knows about signature of your Msg now. Even inside the module.
export abstract class Msg {
    public abstract update(model: Model): Model;
}

class Decrement extends Msg {
    constructor(private readonly amount: number) {
        super();
    }

    public update(model: Model): Model {
        return { ...model, count: model.count + this.amount };
    }
}

class Decrement extends Msg {
    constructor(private readonly amount: number) {
        super();
    }

    public update(model: Model): Model {
        return { ...model, count: model.count - this.amount };
    }
}

class Reset extends Msg {
    public update(model: Model): Model {
        return { ...model, count: 0 };
    }
}
```

## Disadvantages

1. Everyone likes Redux.

## Known issues

### No production build

There is no produciton build configuration of webpack.
Actually it possible to run `npm run build` but produced code will not be well optimised
and procution-ready.
For good performace at least js should be tree-shaked and uglified,
`styled-components` should build output css thru Babel as 
[recommended][styled-component-installation].

### Enzyme + styled-components is broken

Styled components 4 uses the new `ContextConsumer` component, 
which [breaks tests that use wrapper.dive()](https://github.com/airbnb/enzyme/issues/1647).

### No tests for Fractal's containers

Yes, there is a problem with testing of declarative wrappers (`Task`, `Time`, `Cmd`, `Sub`, etc).
Some special Fractal-test-kit should be implemented here for writing common 
declarative checking. The most important thing is that all of those containers do 
just describing of side effects. It means that no one Http request or timeout will not 
be triggered outside of a Fractal's app. Therefore we don't need to implement mocking of 
that side effects - we just need to compare configurations of containers.
It's a very powerful concept and I have a couple of ideas how to implement that.
But a little bit later...

## Alternatives

Checkout to [exchange-app][exchange-app] branch where `Msg` and `Stage`
of components are implemented by Redux-way.

[exchangeratesapi.io]: https://exchangeratesapi.io
[elm-lang]: http://elm-lang.org
[owanturist-maybe]: https://github.com/owanturist/Maybe
[elm-core]: https://package.elm-lang.org/packages/elm/core/latest
[elm-json]: https://package.elm-lang.org/packages/elm/json/latest
[elm-time]: https://package.elm-lang.org/packages/elm/time/latest
[elm-remote-data]: https://package.elm-lang.org/packages/krisajenkins/remotedata/latest
[node-install]: https://nodejs.org/en/download/
[nvm-install]: https://github.com/creationix/nvm#installation
[styled-component-installation]: https://www.styled-components.com/docs/basics#installation
[exchange-app]: https://github.com/owanturist/counter-elm-way/tree/exchange-app
