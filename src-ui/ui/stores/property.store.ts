import { create } from "zustand";


type PropertyStoreState = {
    objectId: string | null;
    version: number;
}

type PropertyStoreActions = {
    setObjectId: (objectId: string | null) => void;
    refresh: () => void;
}

type PropertyStore = PropertyStoreState & {
    actions: PropertyStoreActions;
}

const usePropertyStore = create<PropertyStore>((set) => {
    return {
        objectId: null,
        version: 0,

        actions: {
            setObjectId: (objectId) => set({ objectId }),
            refresh: () => set((state) => ({ version: (state.version + 1) % Number.MAX_SAFE_INTEGER })),
        },
    }
})

export const usePropertyObjectId = () => usePropertyStore((state) => state.objectId);
export const usePropertyStoreVersion = () => usePropertyStore((state) => state.version);
export const usePropertyActions = () => usePropertyStore((state) => state.actions);

export const getPropertyStoreState = () => usePropertyStore.getState();
export const resetPropertyStoreForTest = () => usePropertyStore.setState(usePropertyStore.getInitialState(), true);
export const setPropertyStoreStateForTest = (state: Partial<PropertyStoreState>) => usePropertyStore.setState(state);
