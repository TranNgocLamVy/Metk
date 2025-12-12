import { create } from "zustand";

import { AppCoreService } from "@/shared/services/appCoreService";

export type AppcoreState = {
    isAppcoreLoaded: boolean;
    setIsAppcoreLoaded: (value: boolean) => void;
}

export const useAppcore = create<AppcoreState>((set, get) => {
    AppCoreService.load();
    return {
        isAppcoreLoaded: false,
        setIsAppcoreLoaded: (value: boolean) => set({ isAppcoreLoaded: value }),
    }
});