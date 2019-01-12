import {
    Task
} from './Task';

abstract class InternalTask<E, T> extends Task<E, T> {
    public static spawn<E, T>(spawner: (callback: (task: Task<E, T>) => void) => void): Task<E, T> {
        return Task.spawn(spawner);
    }
}

export const sleep = (delay: number): Task<never, NodeJS.Timer> => InternalTask.spawn(
    (callback: (task: Task<never, NodeJS.Timer>) => void): void => {
        const timeoutID: NodeJS.Timer = setTimeout(
            () => callback(
                Task.succeed(timeoutID)
            ),
            delay
        );
    }
);

export const kill = (processID: NodeJS.Timer): Task<never, void> => InternalTask.spawn(
    (callback: (task: Task<never, void>) => void): void => {
        callback(
            Task.succeed(clearTimeout(processID))
        );
    }
);
