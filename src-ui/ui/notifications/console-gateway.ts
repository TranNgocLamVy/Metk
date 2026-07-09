import { getConsoleStoreState } from "@/ui/stores/console.store";
import { Result } from "@/shared/types/result";
import { v4 as uuidv4 } from "uuid";

export class Console {
    static log(payload: Omit<LogMessage, "id" | "uiId" | "timestamp" | "level">, customId?: string) {
        const id = customId ?? uuidv4();
        const uiId = uuidv4();
        const timestamp = Date.now();
        getConsoleStoreState().actions.addLog({ id, uiId, timestamp, level: "info", ...payload });
    }

    static success(payload: Omit<LogMessage, "id" | "uiId" | "timestamp" | "level">, customId?: string) {
        const id = customId ?? uuidv4();
        const uiId = uuidv4();
        const timestamp = Date.now();
        getConsoleStoreState().actions.addLog({ id, uiId, timestamp, level: "success", ...payload });
    }

    static warn(payload: Omit<LogMessage, "id" | "uiId" | "timestamp" | "level">, customId?: string) {
        const id = customId ?? uuidv4();
        const uiId = uuidv4();
        const timestamp = Date.now();
        getConsoleStoreState().actions.addLog({ id, uiId, timestamp, level: "warning", ...payload });
    }

    static error(payload: Omit<ErrorMessage, "id" | "uiId" | "timestamp">, customId?: string) {
        const id = customId ?? uuidv4();
        const uiId = uuidv4();
        const timestamp = Date.now();
        payload.stacks = payload.stacks ?? [];
        payload.stacks.filter(stack => stack !== undefined);
        getConsoleStoreState().actions.addError({ id, uiId, timestamp, ...payload });
    }

    static removeLog(id: string) {
        getConsoleStoreState().actions.removeLog(id);
    }

    static removeError(id: string) {
        getConsoleStoreState().actions.removeError(id);
    }

    static clear() {
        getConsoleStoreState().actions.clearAll();
    }

    static clearLogs() {
        getConsoleStoreState().actions.clearLogs();
    }

    static clearErrors() {
        getConsoleStoreState().actions.clearErrors();
    }
}

export type LogLevel = "info" | "success" | "warning";

export interface ConsoleAction {
    label: TranslatableMessage;
    variant?: "destructive" | "outline" | "ghost";
    onClick: () => Result | Promise<Result>;
}

export interface LogMessage {
    id: string;
    uiId: string; // Id only for rendering
    message: TranslatableMessage;
    timestamp: number;
    level: LogLevel;
    details?: TranslatableMessage;
    actions?: ConsoleAction[];
}

export interface ErrorMessage {
    id: string;
    uiId: string; // Id only for rendering
    message?: TranslatableMessage;
    stacks?: TranslatableMessage[];
    timestamp: number;
    actions?: ConsoleAction[];
}
