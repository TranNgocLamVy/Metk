import { create } from "zustand";

type LogStore = {
    logs: string[];
    addLog: (log: string) => void;
    clearLogs: () => void;
}

export const useLogStore = create<LogStore>((set, get) => {
    return {
        logs: [],
        addLog: (log: string) => {
            set({ logs: [...get().logs, log] });
        },
        clearLogs: () => {
            set({ logs: [] });
        }
    };
});