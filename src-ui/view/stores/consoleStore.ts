import { create } from "zustand";


type ConsoleType = "log" | "error";

interface ConsoleState {
    isConsoleOpen: boolean;
    consoleType: ConsoleType;
    
    toggleConsole: () => void;
    closeConsole: () => void;
    openConsole: () => void;
    setConsoleType: (type: ConsoleType) => void;
    toggleWithType: (type: ConsoleType) => void;
    openWithType: (type: ConsoleType) => void;
}

export const useConsoleStore = create<ConsoleState>((set, get) => ({
    isConsoleOpen: false,
    consoleType: "log",

    toggleConsole: () => set((state) => ({ isConsoleOpen: !state.isConsoleOpen })),
    closeConsole: () => set((state) => ({ isConsoleOpen: false })),
    openConsole: () => set((state) => ({ isConsoleOpen: true })),
    setConsoleType: (type) => set((state) => ({ consoleType: type })),
    toggleWithType: (type) => set((state) => ({ isConsoleOpen: get().isConsoleOpen ? get().consoleType === type ? false : true : true, consoleType: type })),
    openWithType: (type) => set((state) => ({ isConsoleOpen: true, consoleType: type })),
}));