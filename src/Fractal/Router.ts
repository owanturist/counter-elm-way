import {
    Task
} from './Task';
import {
    Sub
} from './Platform/Sub';

abstract class InternalSub<Msg> extends Sub<Msg> {
    public static fromEffect<Msg>(effect: Effect<Msg>): Sub<Msg> {
        return super.fromEffect(effect);
    }

    public static toEffects<Msg>(sub: Sub<Msg>): Array<Effect<Msg>> {
        return super.toEffects(sub);
    }
}

export abstract class Router<AppMsg, SelfMsg, State> {
    public abstract init(): Task<never, State>;

    public abstract onEffects(
        sendToSelf: (selfMsg: SelfMsg) => Task<never, void>,
        effects: Array<unknown>,
        state: State
    ): Task<never, State>;

    public abstract onSelfMsg(
        sendToApp: (appMsg: AppMsg) => Task<never, void>,
        interval: SelfMsg,
        state: State
    ): Task<never, State>;
}

export abstract class Effect<Msg> {
    public static fromSub<Msg>(sub: Sub<Msg>): Array<Effect<Msg>> {
        return InternalSub.toEffects(sub);
    }

    public abstract router: Router<Msg, unknown, unknown>;

    public abstract map<R>(fn: (msg: Msg) => R): Effect<R>;

    public toSub(): Sub<Msg> {
        return InternalSub.fromEffect(this);
    }
}
