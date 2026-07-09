import { create } from "zustand";
import { BaseLayer, IGroupLayer } from "@/editor/model/tilemap/layer/base-layer";

export type LayerView = {
    id: string;
    layer: BaseLayer<any>;
    depth: number;
}

export type DropPosition = 'top' | 'bottom' | 'inside';

type LayerManagerState = {
    editingId: string | null;
    layerViews: LayerView[];
    selectedLayers: string[];
    targetParentLayer: IGroupLayer | null;
}

type LayerManagerActions = {
    setEditingId: (editingId: string | null) => void;
    setLayerViews: (layerViews: LayerView[]) => void;
    setSelectedLayer: (selectedLayers: string[]) => void;
    setTargetParentLayer: (layer: IGroupLayer | null) => void;
}

type LayerManagerStore = LayerManagerState & {
    actions: LayerManagerActions;
}

const useLayerManagerStore = create<LayerManagerStore>((set) => ({
    editingId: null,
    layerViews: [],
    selectedLayers: [],
    targetParentLayer: null,

    actions: {
        setEditingId: (editingId) => set({ editingId }),
        setLayerViews: (layerViews) => set({ layerViews }),
        setSelectedLayer: (selectedLayers) => set({ selectedLayers }),
        setTargetParentLayer: (layer) => set({ targetParentLayer: layer }),
    },
}));

export const useEditingLayerId = () => useLayerManagerStore((state) => state.editingId);
export const useLayerViews = () => useLayerManagerStore((state) => state.layerViews);
export const useSelectedLayers = () => useLayerManagerStore((state) => state.selectedLayers);
export const useTargetParentLayer = () => useLayerManagerStore((state) => state.targetParentLayer);
export const useLayerManagerActions = () => useLayerManagerStore((state) => state.actions);

export const getLayerManagerStoreState = () => useLayerManagerStore.getState();
export const resetLayerManagerStoreForTest = () => useLayerManagerStore.setState(useLayerManagerStore.getInitialState(), true);
export const setLayerManagerStoreStateForTest = (state: Partial<LayerManagerState>) => useLayerManagerStore.setState(state);
