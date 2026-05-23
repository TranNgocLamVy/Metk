import { BaseObject } from "@/editor/model/base-object"
import { create } from "zustand";




type PropertyStoreState = {
    object: BaseObject<any> | null;

    setBaseObject: (object: BaseObject<any> | null) => void;
}

export const usePropertyStore = create<PropertyStoreState>((set, get) => {
    return {
        object: null,
        setBaseObject: (object: BaseObject | null) => set({ object }),
    }
})