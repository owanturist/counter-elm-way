import {
    Cmd
} from 'Platform/Cmd';
import {
    Msg,
    Model,
    FirstCounterMsg,
    SecondCounterMsg,
    TodoListMsg
} from './Types';
import {
    initialModel as CounterInitialModel,
    initialCmd as CounterInitialCmd,
    update as CoutnerUpdate
} from './Counter/State';
import {
    initialModel as TodoInitialModel,
    initialCmd as TodoInitialCmd,
    update as TodoUpdate
} from './Todo/State';

export const initialModel: Model = {
    firstCounter: CounterInitialModel,
    secondCounter: CounterInitialModel,
    todoList: TodoInitialModel
};

export const initialCmd: Cmd<Msg> = Cmd.butch<Msg>([
    CounterInitialCmd.map(FirstCounterMsg),
    CounterInitialCmd.map(SecondCounterMsg),
    TodoInitialCmd.map(TodoListMsg)
]);

export const update = (msg: Msg, model: Model): [ Model, Cmd<Msg>]  => {
    switch (msg.type) {
        case 'FIRST_COUNTER_MSG': {
            const [
                nextFirstCounter,
                counterCmd
            ] = CoutnerUpdate(msg.payload, model.firstCounter);

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
            ] = CoutnerUpdate(msg.payload, model.secondCounter);

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
            ] = TodoUpdate(msg.payload, model.todoList);

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
