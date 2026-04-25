import { useConsoleStore } from "@/view/stores/consoleStore";
import { Result } from "../types/result";
import { v4 as uuidv4 } from "uuid";

export class Console {
    static log(payload: Omit<LogMessage, "id" | "uiId" | "timestamp" | "level">, customId?: string) {
        const id = customId ?? uuidv4();
        const uiId = uuidv4();
        const timestamp = Date.now();
        useConsoleStore.getState().addLog({ id, uiId, timestamp, level: "info", ...payload });
    }

    static success(payload: Omit<LogMessage, "id" | "uiId" | "timestamp" | "level">, customId?: string) {
        const id = customId ?? uuidv4();
        const uiId = uuidv4();
        const timestamp = Date.now();
        useConsoleStore.getState().addLog({ id, uiId, timestamp, level: "success", ...payload });
    }

    static warn(payload: Omit<LogMessage, "id" | "uiId" | "timestamp" | "level">, customId?: string) {
        const id = customId ?? uuidv4();
        const uiId = uuidv4();
        const timestamp = Date.now();
        useConsoleStore.getState().addLog({ id, uiId, timestamp, level: "warning", ...payload });
    }

    static error(payload: Omit<ErrorMessage, "id" | "uiId" | "timestamp">, customId?: string) {
        const id = customId ?? uuidv4();
        const uiId = uuidv4();
        const timestamp = Date.now();
        payload.stacks = payload.stacks ?? [];
        payload.stacks.filter(stack => stack !== undefined);
        useConsoleStore.getState().addError({ id, uiId, timestamp, ...payload });
    }

    static removeLog(id: string) {
        useConsoleStore.getState().removeLog(id);
    }

    static removeError(id: string) {
        useConsoleStore.getState().removeError(id);
    }

    static clear() {
        useConsoleStore.getState().clearAll();
    }

    static clearLogs() {
        useConsoleStore.getState().clearLogs();
    }

    static clearErrors() {
        useConsoleStore.getState().clearErrors();
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
