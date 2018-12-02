import * as Http from 'Fractal/Http';
import * as Decode from 'Fractal/Json/Decode';

import {
    ID
} from 'ID';
import {
    Currency
} from 'Currency';

/**
 * Make a request to exhcange service.
 * Rates goes back with -5% for simulate differences
 * between real and service rates.
 *
 * @param from Currency.ID - currency id wich changes from
 * @param to Currency.ID - currency id wich changes to
 * @param toMore Array<Currency.ID> - additional currency ids which changes to
 *
 * @returns Http.Request<Currency.Rates>
 */
export const getRatesFor = (
    from: Currency.ID,
    to: Currency.ID,
    toMore: Array<Currency.ID>
): Http.Request<Currency.Rates> => {
    const currencies = [ to, ...toMore ]
        .filter(currency => !currency.isEqual(from))
        .map(currency => currency.toString())
        .join(',');

    return Http.get('https://api.exchangeratesapi.io/latest')
        .withQueryParam('base', from.toString())
        .withQueryParam('symbols', currencies)
        .withExpectJson(
            Decode.field(
                'rates',
                Decode.keyValue(Decode.number).map(pairs => pairs.map(
                    ([ code, rate ]): [ Currency.ID, number ] => [ ID.fromString(code), rate * 0.95 ]
                ))
            )
        );
};
