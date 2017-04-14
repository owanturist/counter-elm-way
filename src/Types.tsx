export const FIRST_COUNTER_ACTION = 'FIRST_COUNTER_ACTION';

export const firstCounterAction = (action) => ({
    type: FIRST_COUNTER_ACTION,
    payload: action
});

export const SECOND_COUNTER_ACTION = 'SECOND_COUNTER_ACTION';

export const secondCounterAction = (action) => ({
    type: SECOND_COUNTER_ACTION,
    payload: action
});
