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

### Unhandled input

There is a strange behaviour of handling `onChange` event from `<input type="number" />`
when user type invalid format of number. How to reproduce:
  1. open the app
  1. focus at any field of changer (top or bottom)
  1. type `-` and then `-` again or do the same with any non digit allowed symbol
(`-`, `,`, `+`, `.`, `e`, etc)
  1. React stops handle any change of the input until it become valid again
  1. type any digits or allowed symbols and you'll see that input was changed but nothing else happens

### No production build

There is no produciton build configuration of webpack.
Actually it possible to run `npm run build` but produced code will not be well optimised
and procution-ready.
For good performace at least js should be tree-shaked and uglified,
`styled-components` should build output css thru Babel as 
[recommended][styled-component-installation].

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
