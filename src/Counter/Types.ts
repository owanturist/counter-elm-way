/**
 * --- MESSAGES ---
 */

export type Msg
    = Increment
    | Decrement
    | ScheduleIncrement
    ;

type INCREMENT = 'INCREMENT';
type Increment = {
    type: INCREMENT
};

export const increment = (): Increment => ({
    type: 'INCREMENT'
});

type DECREMENT = 'DECREMENT';
type Decrement = {
    type: DECREMENT
};

export const decrement = (): Decrement => ({
    type: 'DECREMENT'
});

type SCHEDULE_INCREMENT = 'SCHEDULE_INCREMENT';
type ScheduleIncrement = {
    type: SCHEDULE_INCREMENT,
    payload: number
};

export const scheduleIncrement = (wait: number): ScheduleIncrement => ({
    type: 'SCHEDULE_INCREMENT',
    payload: wait
});

/**
 * --- MODEL ---
 */

export type Model = number;
