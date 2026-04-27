import { create } from "zustand";

import { appCore } from "@/core/appcore";

export type AppcoreState = {
    isAppcoreLoaded: boolean;
    setIsAppcoreLoaded: (value: boolean) => void;
}

export const useAppcore = create<AppcoreState>((set, get) => {
    appCore.load().then((result) => {
        set({ isAppcoreLoaded: true });
    })
    return {
        isAppcoreLoaded: false,
        setIsAppcoreLoaded: (value: boolean) => set({ isAppcoreLoaded: value }),
    }
});