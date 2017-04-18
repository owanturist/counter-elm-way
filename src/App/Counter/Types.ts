/**
 * --- MODEL ---
 */

export type Model = number;

/**
 * --- MESSAGES ---
 */

export type Msg
    = Increment
    | Decrement
    | ScheduleIncrement
    ;

export interface Increment {
    type: 'INCREMENT';
}
export const Increment = (): Increment => ({
    type: 'INCREMENT'
});

export interface Decrement {
    type: 'DECREMENT';
}
export const Decrement = (): Decrement => ({
    type: 'DECREMENT'
});

export interface ScheduleIncrement {
    type: 'SCHEDULE_INCREMENT';
    payload: number;
}
export const ScheduleIncrement = (wait: number): ScheduleIncrement => ({
    type: 'SCHEDULE_INCREMENT',
    payload: wait
});
