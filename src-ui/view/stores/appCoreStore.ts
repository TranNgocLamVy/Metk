import { create } from "zustand";

import { AppCore } from "@/core/appcore";

import { useProjectManagerStore } from "./application/projectManagerStore";

export type AppcoreState = {
    isAppcoreLoaded: boolean;
    setIsAppcoreLoaded: (value: boolean) => void;
}

export const useAppcore = create<AppcoreState>((set, get) => {
    AppCore.getIns().load().then((result) => {
        set({ isAppcoreLoaded: true });
        useProjectManagerStore.getState().refresh();
    })
    return {
        isAppcoreLoaded: false,
        setIsAppcoreLoaded: (value: boolean) => set({ isAppcoreLoaded: value }),
    }
});