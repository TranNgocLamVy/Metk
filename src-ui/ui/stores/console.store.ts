import { ErrorMessage, LogMessage } from "@/ui/notifications/console-gateway";
import { create } from "zustand";

type ConsoleType = "log" | "error";

const MAX_LOG_MESSAGES = 200;
const MAX_ERROR_MESSAGES = 50;

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

    addLog: (log: LogMessage) => void;
    addError: (error: ErrorMessage) => void;
    removeLog: (id: string) => void;
    removeError: (id: string) => void;
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

    addLog: (log) => {
        set((state) => {
            const updatedLogs = [...state.logs.filter(l => l.id !== log.id), log];
            return { logs: updatedLogs.slice(-MAX_LOG_MESSAGES) };
        })
    },
    addError: (error) => {
        set((state) => {
            const updatedErrors = [...state.errors.filter(e => e.id !== error.id), error];
            return { 
                errors: updatedErrors.slice(-MAX_ERROR_MESSAGES),
                isConsoleOpen: true, 
                consoleType: "error" 
            };
        })
    },
    removeLog: (id) => set((state) => ({
        logs: state.logs.filter((log) => log.id !== id)
    })),
    removeError: (id) => set((state) => ({
        errors: state.errors.filter((error) => error.id !== id)
    })),
    clearLogs: () => set({ logs: [] }),
    clearErrors: () => set({ errors: [] }),
    clearAll: () => set({ logs: [], errors: [] })
}));