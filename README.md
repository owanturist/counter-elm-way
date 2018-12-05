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

Checkout to [exchange-app-classes][exchange-app-classes] branch where `Msg` and `Stage`
of components are implemented by classes.

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
[exchange-app-classes]: https://github.com/owanturist/counter-elm-way/tree/exchange-app-classes
