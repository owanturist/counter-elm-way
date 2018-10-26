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

const Select = styled.div`
    color: #fff;
`;

const SmallText = styled.small`
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
            {from.symbol}1 = {to.symbol}{first}<SmallText>{second}</SmallText>
        </Select>
    )
});
