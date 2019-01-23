import {
    Task
} from './Task';
import {
    Process
} from './Process';
import {
    Router,
    Effect
} from './Router';
import {
    Sub
} from './Platform/Sub';
import {
    TaskInternal,
    ProcessInternal
} from './__Internal__';

type Processes = Map<number, Process>;

type Taggers<Msg> = Map<number, Array<(posix: number) => Msg>>;

interface State<Msg> {
    taggers: Taggers<Msg>;
    processes: Processes;
}

const timeRouter = new class TimeRouter<Msg> extends Router<Msg, number, State<Msg>> {
    public init(): Task<never, State<Msg>> {
        return Task.succeed({
            taggers: new Map(),
            processes: new Map()
        });
    }

    public onEffects(
        sendToSelf: (interval: number) => Task<never, void>,
        effects: Array<Time<Msg>>,
        { processes }: State<Msg>
    ): Task<never, State<Msg>> {
        const expiredProcesses: Array<Process> = [];
        const newIntervals: Array<number> = [];
        const existingProcesses: Processes = new Map();
        const newTaggers: Taggers<Msg> = effects.reduce(
            (acc: Taggers<Msg>, effect: Time<Msg>): Taggers<Msg> => effect.register(acc),
            new Map()
        );

        for (const [ interval, existingProcess ] of processes) {
            if (newTaggers.has(interval)) {
                existingProcesses.set(interval, existingProcess);
            } else {
                expiredProcesses.push(existingProcess);
            }
        }

        for (const interval of newTaggers.keys()) {
            if (!existingProcesses.has(interval)) {
                newIntervals.push(interval);
            }
        }

        return Task.sequence(expiredProcesses.map((process: Process): Task<never, void> => process.kill()))
            .chain(() => newIntervals.reduce(
                (acc: Task<never, Processes>, interval: number): Task<never, Processes> => {
                    return setEvery(interval, sendToSelf(interval))
                        .spawn()
                        .map((process: Process) => (newProcesses: Processes) => newProcesses.set(interval, process))
                        .pipe(acc);
                },
                Task.succeed(existingProcesses)
            )).map((newProcesses: Processes): State<Msg> => ({
                taggers: newTaggers,
                processes: newProcesses
            }));
    }

    public onSelfMsg(
        sendToApp: (msgs: Array<Msg>) => Task<never, void>,
        interval: number,
        state: State<Msg>
    ): Task<never, State<Msg>> {
        const taggers = state.taggers.get(interval);

        if (typeof taggers === 'undefined') {
            return Task.succeed(state);
        }

        const now = Date.now();

        return sendToApp(
            taggers.map((tagger: (posix: number) => Msg): Msg => tagger(now))
        ).chain(() => Task.succeed(state));
    }
}();

const setEvery = (timeout: number, task: Task<never, void>): Task<never, void> => {
    return TaskInternal.of((done: (task: Task<never, void>) => void): Process => {
        const intervalId = setInterval(() => done(task), timeout);

        return ProcessInternal.of(() => clearInterval(intervalId));
    });
};

export const now: Task<never, number> = TaskInternal.of((done: (task: Task<never, number>) => void): Process => {
    done(Task.succeed(Date.now()));

    return ProcessInternal.none;
});


abstract class Time<Msg> extends Effect<Msg> {
    public router: Router<Msg, number, State<Msg>> = timeRouter as unknown as Router<Msg, number, State<Msg>>;

    public abstract register(taggers: Taggers<Msg>): Taggers<Msg>;
}

class Every<Msg> extends Time<Msg> {
    public constructor(
        private readonly interval: number,
        private readonly tagger: (poxis: number) => Msg
    ) {
        super();
    }

    public map<R>(fn: (msg: Msg) => R): Time<R> {
        return new Every(
            this.interval,
            (posix: number): R => fn(this.tagger(posix))
        );
    }

    public register(taggers: Taggers<Msg>): Taggers<Msg> {
        const bag = taggers.get(this.interval);

        if (typeof bag === 'undefined') {
            taggers.set(this.interval, [ this.tagger ]);
        } else {
            bag.push(this.tagger);
        }

        return taggers;
    }
}

export const every = <Msg>(interval: number, tagger: (posix: number) => Msg): Sub<Msg> => {
    return new Every(interval, tagger).toSub();
};
