import * as Http from 'Fractal/Http';
import * as Decode from 'Fractal/Json/Decode';

import {
    Currency
} from 'Currency';

export interface Response<T> {
    timestamp: number;
    data: T;
}

const responseDecoder = <T>(dataDecoder: Decode.Decoder<T>): Decode.Decoder<Response<T>> => {
    return Decode.props({
        timestamp: Decode.field('timestamp', Decode.number),
        data: dataDecoder
    });
};

export const getRatesFor = (currencies: Array<string>): Http.Request<Response<Array<Currency>>> => {
    return Http.get('https://openexchangerates.org/api/latest.json')
        .withQueryParam('app_id', OPENEXCHANGERATES_APP_ID)
        .withQueryParam('symbols', currencies.join(','))
        .withExpectJson(responseDecoder(
            Decode.field('rates', Decode.keyValue(Decode.number)).map(rates => rates.reduce(
                (acc: Array<Currency>, [ code, weight ]) => Currency.of(code, weight).cata({
                    Nothing: () => acc,
                    Just: currency => [ ...acc, currency ]
                }),
                []
            ))
        ));
};
