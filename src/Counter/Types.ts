export const INCREMENT = 'INCREMENT';

export const increment = () => ({
    type: INCREMENT
});

export const DECREMENT = 'DECREMENT';

export const decrement = () => ({
    type: DECREMENT
});

export const SCHEDULE_INCREMENT = 'SCHEDULE_INCREMENT';

export const scheduleIncrement = (wait) => ({
    type: SCHEDULE_INCREMENT,
    payload: wait
});
