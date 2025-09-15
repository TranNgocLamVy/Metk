import { create } from "zustand";

type DebugStore = {
    version: number;
    rerender: () => void;
}

export const useDebugStore = create<DebugStore>((set) => ({
    version: 0,
    rerender: () => {
        set((state) => ({ version: state.version + 1 }));
    },
}));