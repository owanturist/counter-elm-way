import * as Http from 'Fractal/Http';
import * as Decode from 'Fractal/Json/Decode';

/**
 * Make a request to exhcange service.
 * Rates goes back with -5% for simulate differences
 * between real and service rates.
 *
 * @param base String - currency code wich changes from
 * @param currencies Array<string> - currency codes which changes to
 *
 * @returns Http.Request<Array<[ string, number ]>>
 */
export const getRatesFor = (base: string, currencies: Array<string>): Http.Request<Array<[ string, number ]>> => {
    return Http.get('https://api.exchangeratesapi.io/latest')
        .withQueryParam('base', base)
        .withQueryParam('symbols', currencies.filter(currency => currency !== base).join(','))
        .withExpectJson(
            Decode.field('rates', Decode.keyValue(Decode.number.map(rate => rate * 0.95)))
        );
};
