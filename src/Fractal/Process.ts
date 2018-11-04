import {
    Task
} from './Task';

abstract class InternalTask<E, T> extends Task<E, T> {
    public static of<E, T>(executor: (fail: (error: E) => void, succeed: (value: T) => void) => void): Task<E, T> {
        return Task.of(executor);
    }
}

export const sleep = (delay: number): Task<never, NodeJS.Timer> => InternalTask.of(
    (_fail: (error: never) => void, succeed: (processID: NodeJS.Timer) => void) => {
        const timeoutID: NodeJS.Timer = setTimeout(
            () => succeed(timeoutID),
            delay
        );
    }
);

export const kill = (processID: NodeJS.Timer): Task<never, void> => InternalTask.of(
    (_fail: (error: never) => void, succeed: (value: void) => void) => {
        succeed(clearTimeout(processID));
    }
);
