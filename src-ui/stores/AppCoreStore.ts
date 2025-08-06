import { create } from "zustand";

export type AppCoreState = {
    isLoading: boolean;
    setIsLoading: (value: boolean) => void;
}

export const useAppCore = create<AppCoreState>((set) => ({
    isLoading: false,
    setIsLoading: (value) => set({ isLoading: value }),
}));