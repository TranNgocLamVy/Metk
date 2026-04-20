import { create } from "zustand";


type TerminalType = "log" | "error";

interface TerminalState {
    isTerminalOpen: boolean;
    terminalType: TerminalType;
    
    toggleTerminal: () => void;
    closeTerminal: () => void;
    openTerminal: () => void;
    setTerminalType: (type: TerminalType) => void;
    toggleWithType: (type: TerminalType) => void;
    openWithType: (type: TerminalType) => void;
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
    isTerminalOpen: false,
    terminalType: "log",

    toggleTerminal: () => set((state) => ({ isTerminalOpen: !state.isTerminalOpen })),
    closeTerminal: () => set((state) => ({ isTerminalOpen: false })),
    openTerminal: () => set((state) => ({ isTerminalOpen: true })),
    setTerminalType: (type) => set((state) => ({ terminalType: type })),
    toggleWithType: (type) => set((state) => ({ isTerminalOpen: get().isTerminalOpen ? get().terminalType === type ? false : true : true, terminalType: type })),
    openWithType: (type) => set((state) => ({ isTerminalOpen: true, terminalType: type })),
}));