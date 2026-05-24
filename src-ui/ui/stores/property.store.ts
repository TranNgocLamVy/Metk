import { create } from "zustand";


type PropertyStoreState = {
    objectId: string | null;

    setObjectId: (objectId: string | null) => void;
}

export const usePropertyStore = create<PropertyStoreState>((set, get) => {
    return {
        objectId: null,
        setObjectId: (objectId: string | null) => set({ objectId }),
    }
})