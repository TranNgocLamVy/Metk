import { create } from "zustand";

import { appCore } from "@/core/appcore";

import { useProjectManagerStore } from "./projectManagerStore";

export type AppcoreState = {
    isAppcoreLoaded: boolean;
    setIsAppcoreLoaded: (value: boolean) => void;
}

export const useAppcore = create<AppcoreState>((set, get) => {
    appCore.load().then((result) => {
        set({ isAppcoreLoaded: true });
        useProjectManagerStore.getState().refresh();
    })
    return {
        isAppcoreLoaded: false,
        setIsAppcoreLoaded: (value: boolean) => set({ isAppcoreLoaded: value }),
    }
});