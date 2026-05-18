import { create } from "zustand";

import { appKernel } from "@/application/bootstrap/app-kernel";

export type AppcoreState = {
    isAppcoreLoaded: boolean;
    setIsAppcoreLoaded: (value: boolean) => void;
}

export const useAppcore = create<AppcoreState>((set, get) => {
    appKernel.load().then((result) => {
        set({ isAppcoreLoaded: true });
    })
    return {
        isAppcoreLoaded: false,
        setIsAppcoreLoaded: (value: boolean) => set({ isAppcoreLoaded: value }),
    }
});