import * as Http from 'Fractal/Http';
import * as Decode from 'Fractal/Json/Decode';

export const getRatesFor = (base: string, currencies: Array<string>): Http.Request<Array<[ string, number ]>> => {
    return Http.get('https://api.exchangeratesapi.io/latest')
        .withQueryParam('base', base)
        .withQueryParam('symbols', currencies.join(','))
        .withExpectJson(
            Decode.field('rates', Decode.keyValue(Decode.number))
        );
};
