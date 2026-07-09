import { create } from "zustand";

export type EntityCollectionDisplayData = {
    id: string;
    name: string;
};

type EntityCollectionState = {
    entityCollectionDisplayDatas: EntityCollectionDisplayData[];
    selectedEntityCollectionId: string | null;
    selectedEntityId: string | null;
};

type EntityCollectionActions = {
    setEntityCollectionDisplayData: (entityCollectionDisplayDatas: EntityCollectionDisplayData[]) => void;
    setSelectedEntityCollectionId: (currentSelectedEntityCollectionId: string | null) => void;
    setSelectedEntityId: (currentSelectedEntityId: string | null) => void;
};

type EntityCollectionStore = EntityCollectionState & {
    actions: EntityCollectionActions;
};

const useEntityCollectionStore = create<EntityCollectionStore>((set) => ({
    entityCollectionDisplayDatas: [],
    selectedEntityCollectionId: null,
    selectedEntityId: null,

    actions: {
        setEntityCollectionDisplayData: (entityCollectionDisplayDatas) => set({ entityCollectionDisplayDatas }),
        setSelectedEntityCollectionId: (currentSelectedEntityCollectionId) => set({ selectedEntityCollectionId: currentSelectedEntityCollectionId }),
        setSelectedEntityId: (currentSelectedEntityId) => set({ selectedEntityId: currentSelectedEntityId }),
    },
}));

export const useEntityCollectionDisplayDatas = () => useEntityCollectionStore((state) => state.entityCollectionDisplayDatas);
export const useSelectedEntityCollectionId = () => useEntityCollectionStore((state) => state.selectedEntityCollectionId);
export const useSelectedEntityId = () => useEntityCollectionStore((state) => state.selectedEntityId);
export const useEntityCollectionActions = () => useEntityCollectionStore((state) => state.actions);

export const getEntityCollectionStoreState = () => useEntityCollectionStore.getState();
export const resetEntityCollectionStoreForTest = () => useEntityCollectionStore.setState(useEntityCollectionStore.getInitialState(), true);
export const setEntityCollectionStoreStateForTest = (state: Partial<EntityCollectionState>) => useEntityCollectionStore.setState(state);
