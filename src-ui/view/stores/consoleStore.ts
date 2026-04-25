import { create } from "zustand";
import { ErrorMessage, LogMessage } from "@/shared/services/consoleService";

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
        set((state) => ({ logs: [...state.logs.filter(l => l.id !== log.id), log] }))
    },
    addError: (error) => {
        set((state) => ({ errors: [...state.errors.filter(e => e.id !== error.id), error], isConsoleOpen: true, consoleType: "error"}))
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