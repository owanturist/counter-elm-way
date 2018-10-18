import {
    Task
} from './Task';

abstract class InternalTask<E, T> extends Task<E, T> {
    public static of<E, T>(executor: (succeed: (value: T) => void, fail: (error: E) => void) => void): Task<E, T> {
        return Task.of(executor);
    }
}

export const sleep = (delay: number): Task<never, NodeJS.Timer> => InternalTask.of(
    (succeed: (processID: NodeJS.Timer) => void) => {
        const timeoutID: NodeJS.Timer = setTimeout(
            () => succeed(timeoutID),
            delay
        );
    }
);

export const kill = (processID: NodeJS.Timer): Task<never, void> => InternalTask.of(
    (succeed: (value: void) => void) => {
        succeed(clearTimeout(processID));
    }
);
