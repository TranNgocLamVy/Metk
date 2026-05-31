import { create } from "zustand";

export type EntityCollectionDisplayData = {
    id: string;
    name: string;
};

type EntityCollectionStoreState = {
    entityCollectionDisplayDatas: EntityCollectionDisplayData[];
    selectedEntityCollectionId: string | null;
    selectedEntityId: string | null;

    setEntityCollectionDisplayData: (entityCollectionDisplayDatas: EntityCollectionDisplayData[]) => void;
    setSelectedEntityCollectionId: (currentSelectedEntityCollectionId: string | null) => void;
    setSelectedEntityId: (currentSelectedEntityId: string | null) => void;
};

export const useEntityCollectionStore = create<EntityCollectionStoreState>((set) => ({
    entityCollectionDisplayDatas: [],
    selectedEntityCollectionId: null,
    selectedEntityId: null,

    setEntityCollectionDisplayData: (entityCollectionDisplayDatas) => set({ entityCollectionDisplayDatas }),
    setSelectedEntityCollectionId: (currentSelectedEntityCollectionId) => set({ selectedEntityCollectionId: currentSelectedEntityCollectionId }),
    setSelectedEntityId: (currentSelectedEntityId) => set({ selectedEntityId: currentSelectedEntityId }),
}));