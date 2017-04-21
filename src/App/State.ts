import {
    Cmd
} from 'Platform/Cmd';

import * as Counter from 'App/Counter/State';
import * as Todo from 'App/Todo/State';
import {
    Msg,
    Model,
    FirstCounterMsg,
    SecondCounterMsg,
    TodoListMsg
} from './Types';

export const initialModel: Model = Model(
    Counter.initialModel,
    Counter.initialModel,
    Todo.initialModel
);

export const initialCmd: Cmd<Msg> = Cmd.butch<Msg>([
    Counter.initialCmd.map(FirstCounterMsg),
    Counter.initialCmd.map(SecondCounterMsg),
    Todo.initialCmd.map(TodoListMsg)
]);

export const update = (msg: Msg, model: Model): [ Model, Cmd<Msg>]  => {
    switch (msg.type) {
        case 'FIRST_COUNTER_MSG': {
            const [
                nextFirstCounter,
                counterCmd
            ] = Counter.update(msg.payload, model.firstCounter);

            return [
                {
                    ...model,
                    firstCounter: nextFirstCounter
                },
                counterCmd.map(FirstCounterMsg)
            ];
        }

        case 'SECOND_COUNTER_MSG': {
            const [
                nextSecondCounter,
                counterCmd
            ] = Counter.update(msg.payload, model.secondCounter);

            return [
                {
                    ...model,
                    secondCounter: nextSecondCounter
                },
                counterCmd.map(SecondCounterMsg)
            ];
        }

        case 'TODO_LIST_MSG': {
            const [
                nextTodoList,
                todoListCmd
            ] = Todo.update(msg.payload, model.todoList);

            return [
                {
                    ...model,
                    todoList: nextTodoList
                },
                todoListCmd.map(TodoListMsg)
            ];
        }

        default: {
            /**
             * Stub for @@redux/INIT action.
             * It should be placed inside only root update.
             */

            return [ model, Cmd.none() ];
        }
    }
};
