import { create } from "zustand";

import { appKernel } from "@/application/bootstrap/app-kernel";

type AppcoreState = {
    isAppcoreLoaded: boolean;
}

type AppcoreActions = {
    setIsAppcoreLoaded: (value: boolean) => void;
}

type AppcoreStore = AppcoreState & {
    actions: AppcoreActions;
}

const useAppcoreStore = create<AppcoreStore>((set) => {
    appKernel.load().then(() => {
        set({ isAppcoreLoaded: true });
    })
    return {
        isAppcoreLoaded: false,
        actions: {
            setIsAppcoreLoaded: (value) => set({ isAppcoreLoaded: value }),
        },
    }
});

export const useIsAppcoreLoaded = () => useAppcoreStore((state) => state.isAppcoreLoaded);
export const useAppcoreActions = () => useAppcoreStore((state) => state.actions);

export const getAppcoreStoreState = () => useAppcoreStore.getState();
export const resetAppcoreStoreForTest = () => useAppcoreStore.setState(useAppcoreStore.getInitialState(), true);
export const setAppcoreStoreStateForTest = (state: Partial<AppcoreState>) => useAppcoreStore.setState(state);
