import { useConsoleStore, ConsoleAction } from "@/view/stores/consoleStore";

export class Console {
    static log(message: string, details?: string, actions?: ConsoleAction[]) {
        useConsoleStore.getState().addLog({ level: "info", message, details, actions });
    }

    static success(message: string, details?: string, actions?: ConsoleAction[]) {
        useConsoleStore.getState().addLog({ level: "success", message, details, actions });
    }

    static warn(message: string, details?: string, actions?: ConsoleAction[]) {
        useConsoleStore.getState().addLog({ level: "warning", message, details, actions });
    }

    static error(message: string, stack?: string, actions?: ConsoleAction[]) {
        useConsoleStore.getState().addError({ message, stack, actions });
    }

    static clear() {
        useConsoleStore.getState().clearAll();
    }
}