import * as Encode from './Json/Encode';
import {
    Task
} from './Task';
import {
    Sub
} from './Platform/Sub';

abstract class InternalTask<E, T> extends Task<E, T> {
    public static spawn<E, T>(spawner: (callback: (task: Task<E, T>) => void) => void): Task<E, T> {
        return Task.spawn(spawner);
    }
}

abstract class InternalSub<Msg> extends Sub<Msg> {
    public static of<T, Msg>(
        namespace: string,
        key: Encode.Encoder,
        tagger: (config: T) => Msg,
        executor: (callback: (config: T) => void) => () => void
    ): Sub<Msg> {
        return Sub.of(namespace, key, tagger, executor);
    }
}

export const every = <Msg>(delay: number, tagger: (posix: number) => Msg): Sub<Msg> => {
    return InternalSub.of(
        'TIME',
        Encode.number(delay),
        tagger,
        (callback: (posix: number) => void) => {
            const intervalID = setInterval(() => {
                callback(Date.now());
            }, delay);

            return () => {
                clearInterval(intervalID);
            };
        }
    );
};

export const now: Task<never, number> = InternalTask.spawn(
    (callback: (task: Task<never, number>) => void): void => {
        callback(
            Task.succeed(Date.now())
        );
    }
);
