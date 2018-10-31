import * as React from 'react';
import styled from 'styled-components';

import {
    Maybe,
    Nothing,
    Just
} from 'Fractal/Maybe';

import {
    Currency
} from './Currency';

const Select = styled.button`
    display: inline-block;
    padding: .2em .4em;
    font-weight: 300;
    font-size: 16px;
    letter-spacing: .05em;
    color: #fff;
    background: rgba(0, 0, 0, .1);
    border: 1px solid rgba(255, 255, 255, .5);
    border-radius: .35em;
    outline: none;

    &:after {
        content: "";
        display: inline-block;
        margin-left: .3em;
        border: 0 solid transparent;
        border-width: .3em .3em 0
        border-top-color: #fff;
        vertical-align: middle;
    }
`;

const Small = styled.small`
    font-size: .8em;
`;

const matchDecimals = (rate: number): Maybe<[ string, string ]> => {
    const result = rate.toFixed(4).match(/(\d{1,}\.\d{2})(\d{2})/);

    if (result == null) {
        return Nothing;
    }

    const [ , first, second ] = result;

    return Just([ first, second ] as [ string, string ]);
};

export const View: React.StatelessComponent<{
    from: Currency;
    to: Currency;
}> = ({ from, to }) => to.convertFrom(1, from).chain(matchDecimals).cata({
    Nothing: () => null,
    Just: ([ first, second ]) => (
        <Select>
            <Small>{from.symbol}</Small>1 = <Small>{to.symbol}</Small>{first}<Small>{second}</Small>
        </Select>
    )
});
