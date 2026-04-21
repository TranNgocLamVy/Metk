import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
export type LogLevel = "info" | "success" | "warning";

export interface ConsoleAction {
    label: string;
    variant?: "default" | "destructive";
    onClick: () => void;
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
    stack?: string;
    actions?: ConsoleAction[];
}

type ConsoleType = "log" | "error";

interface ConsoleState {
    isConsoleOpen: boolean;
    consoleType: ConsoleType;
    logs: LogMessage[];
    errors: ErrorMessage[];
    
    toggleConsole: () => void;
    closeConsole: () => void;
    openConsole: () => void;
    setConsoleType: (type: ConsoleType) => void;
    toggleWithType: (type: ConsoleType) => void;
    openWithType: (type: ConsoleType) => void;

    addLog: (log: Omit<LogMessage, "id" | "timestamp">) => void;
    addError: (error: Omit<ErrorMessage, "id" | "timestamp">) => void;
    clearLogs: () => void;
    clearErrors: () => void;
    clearAll: () => void;
}

export const useConsoleStore = create<ConsoleState>((set, get) => ({
    isConsoleOpen: false,
    consoleType: "log",
    logs: [],
    errors: [],

    toggleConsole: () => set((state) => ({ isConsoleOpen: !state.isConsoleOpen })),
    closeConsole: () => set({ isConsoleOpen: false }),
    openConsole: () => set({ isConsoleOpen: true }),
    setConsoleType: (type) => set({ consoleType: type }),
    toggleWithType: (type) => set((state) => ({ 
        isConsoleOpen: state.isConsoleOpen ? (state.consoleType === type ? false : true) : true, 
        consoleType: type 
    })),
    openWithType: (type) => set({ isConsoleOpen: true, consoleType: type }),

    addLog: (log) => set((state) => ({ 
        logs: [...state.logs, { ...log, id: uuidv4(), timestamp: Date.now() }] 
    })),
    addError: (error) => set((state) => ({ 
        errors: [...state.errors, { ...error, id: uuidv4(), timestamp: Date.now() }],
        isConsoleOpen: true,
        consoleType: "error"
    })),
    clearLogs: () => set({ logs: [] }),
    clearErrors: () => set({ errors: [] }),
    clearAll: () => set({ logs: [], errors: [] })
}));