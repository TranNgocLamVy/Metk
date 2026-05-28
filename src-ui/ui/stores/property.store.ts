import { create } from "zustand";


type PropertyStoreState = {
    objectId: string | null;
    version: number;

    setObjectId: (objectId: string | null) => void;
    refresh: () => void;
}

export const usePropertyStore = create<PropertyStoreState>((set, get) => {
    return {
        objectId: null,
        version: 0,
        
        setObjectId: (objectId: string | null) => set({ objectId }),
        refresh: () => set((state) => ({ version: (state.version + 1) % Number.MAX_SAFE_INTEGER })),
    }
})

export const usePropertyStoreVersion = () => usePropertyStore((state) => state.version);