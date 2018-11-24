import {
    Maybe
} from '../Maybe';

interface ValueArray extends Array<Value> {}

export type Value
    = undefined
    | null
    | string
    | boolean
    | number
    | ValueArray
    | {[ key: string ]: Value }
    ;

export abstract class Encoder {
    public encode(indent: number): string {
        return JSON.stringify(this.serialize(), null, indent);
    }

    public abstract serialize(): Value;
}

namespace Encode {
    export class Primitive<T extends null | string | boolean | number> extends Encoder {
        constructor(private readonly primitive: T) {
            super();
        }

        public serialize(): T {
            return this.primitive;
        }
    }

    export class List extends Encoder {
        constructor(private readonly array: Array<Encoder>) {
            super();
        }

        public serialize(): Array<Value> {
            const result: Array<Value> = [];

            for (const value of this.array) {
                result.push(value.serialize());
            }

            return result;
        }
    }

    export class Object extends Encoder {
        constructor(private readonly object: {[ key: string ]: Encoder}) {
            super();
        }

        public serialize(): {[ key: string ]: Value } {
            const result: {[ key: string ]: Value } = {};

            for (const key in this.object) {
                if (this.object.hasOwnProperty(key)) {
                    result[ key ] = this.object[ key ].serialize();
                }
            }

            return result;
        }
    }
}

export const nill: Encoder = new Encode.Primitive(null);

export const string = (string: string): Encoder => new Encode.Primitive(string);
export const number = (number: number): Encoder => new Encode.Primitive(number);
export const boolean = (boolean: boolean): Encoder => new Encode.Primitive(boolean);

export const nullable = <T>(encoder: (value: T) => Encoder, maybe: Maybe<T>): Encoder => {
    return maybe.map(encoder).getOrElse(nill);
};

export const list = (array: Array<Encoder>): Encoder => new Encode.List(array);

export const listOf = <T>(encoder: (value: T) => Encoder, array: Array<T>): Encoder => {
    const result: Array<Encoder> = [];

    for (const value of array) {
        result.push(encoder(value));
    }

    return list(result);
};

export const object = <T extends {[ key: string ]: Encoder }>(object: T): Encoder => {
    return new Encode.Object(object);
};
