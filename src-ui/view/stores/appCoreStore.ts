import { create } from "zustand";

export type AppcoreState = {
    isLoading: boolean;
    setIsLoading: (value: boolean) => void;
}

export const useAppcore = create<AppcoreState>((set) => ({
    isLoading: true,
    setIsLoading: (value) => set({ isLoading: value }),
}));