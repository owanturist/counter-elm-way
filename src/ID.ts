import * as Decode from 'Fractal/Json/Decode';
import * as Encode from 'Fractal/Json/Encode';


export class ID<T extends string> {
    public static get decoder(): Decode.Decoder<ID<any>> {
        return Decode.oneOf([
            Decode.string.map(ID.fromString),
            Decode.number.map(ID.fromNumber)
        ]);
    }

    public static fromString<T extends string>(id: string): ID<T> {
        return new ID(id);
    }

    public static fromNumber<T extends string>(id: number): ID<T> {
        return new ID(id.toString());
    }

    protected namespace?: T;

    private constructor(private readonly value: string) {}

    public isEqual(another: ID<T>): boolean {
        return this.value === another.value;
    }

    public toString(): string {
        return this.value;
    }

    public get encoder(): Encode.Encoder {
        return Encode.string(this.value);
    }
}
