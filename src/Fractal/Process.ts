import {
    Task
} from './Task';


abstract class InternalTask<E, T> extends Task<E, T> {
    public static of<E, T>(callback: (done: (task: Task<E, T>) => void) => Process): Task<E, T> {
        return Task.of(callback);
    }
}

export abstract class Process {
    public static sleep(delay: number): Task<never, void> {
        return InternalTask.of((done: (task: Task<never, void>) => void): Process => {
            const timeoutID = setTimeout(() => done(Task.succeed(undefined)), delay);

            return Process.of(() => clearTimeout(timeoutID));
        });
    }

    protected static of(abort: () => void): Process {
        return new Single(abort);
    }

    protected static get none(): Process {
        return none;
    }

    public abstract kill(): Task<never, void>;
}

class Single extends Process {
    public constructor(private readonly abort: () => void) {
        super();
    }

    public kill(): Task<never, void> {
        return InternalTask.of((done: (task: Task<never, void>) => void): Process => {
            done(Task.succeed(this.abort()));

            return Process.none;
        });
    }
}

const none: Process = new class extends Process {
    public kill(): Task<never, void> {
        return Task.succeed(undefined);
    }
}();
