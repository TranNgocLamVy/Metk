import { create } from "zustand";

export type AppcoreState = {
    isLoading: boolean;
    setIsLoading: (value: boolean) => void;
}

export const useAppcore = create<AppcoreState>((set) => ({
    isLoading: false,
    setIsLoading: (value) => set({ isLoading: value }),
}));