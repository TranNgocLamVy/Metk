import { useConsoleStore } from "@/view/stores/consoleStore";
import { Result } from "../types/result";
import { v4 as uuidv4 } from "uuid";

export class Console {
    static log(payload: Omit<LogMessage, "id" | "timestamp" | "level">, customId?: string) {
        const id = customId ?? uuidv4();
        const timestamp = Date.now();
        useConsoleStore.getState().addLog({ id, timestamp, level: "info", ...payload });
    }

    static success(payload: Omit<LogMessage, "id" | "timestamp" | "level">, customId?: string) {
        const id = customId ?? uuidv4();
        const timestamp = Date.now();
        useConsoleStore.getState().addLog({ id, timestamp, level: "success", ...payload });
    }

    static warn(payload: Omit<LogMessage, "id" | "timestamp" | "level">, customId?: string) {
        const id = customId ?? uuidv4();
        const timestamp = Date.now();
        useConsoleStore.getState().addLog({ id, timestamp, level: "warning", ...payload });
    }

    static error(payload: Omit<ErrorMessage, "id" | "timestamp">, customId?: string) {
        const id = customId ?? uuidv4();
        const timestamp = Date.now();
        useConsoleStore.getState().addError({ id, timestamp, ...payload });
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
    label: string;
    variant?: "destructive" | "outline" | "ghost";
    onClick: () => Result | Promise<Result>;
}

export interface LogMessage {
    id: string;
    timestamp: number;
    level: LogLevel;
    message: string;
    details?: string;
    actions?: ConsoleAction[];
}

export interface ErrorMessage {
    id: string;
    timestamp: number;
    message: string;
    stacks?: string[];
    actions?: ConsoleAction[];
}
