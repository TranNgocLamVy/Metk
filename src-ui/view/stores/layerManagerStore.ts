import { create } from "zustand";
import { BaseLayer, IGroupLayer } from "@/core/application/tile/layer/baseLayer";

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

    setEditingId: (editingId: string | null) => void;
    setLayerViews: (layerViews: LayerView[]) => void;
    setSelectedLayer: (selectedLayers: string[]) => void;
    setTargetParentLayer: (layer: IGroupLayer | null) => void;
}

export const useLayerManagerStore = create<LayerManagerState>((set, get) => ({
    editingId: null,
    layerViews: [],
    selectedLayers: [],
    targetParentLayer: null,

    setEditingId: (editingId) => set({ editingId }),
    setLayerViews: (layerViews) => set({ layerViews }),
    setSelectedLayer: (selectedLayers) => set({ selectedLayers }),
    setTargetParentLayer: (layer) => set({ targetParentLayer: layer }),
}));