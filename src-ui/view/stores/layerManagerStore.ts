import { create } from "zustand";

import { TilemapSession } from "@/core/application/session/tilemapSession";
import { BaseLayer } from "@/core/application/tile/layer/baseLayer";
import { GroupLayer } from "@/core/application/tile/layer/groupLayer";
import { AppCore } from "@/core/appcore";

export type LayerView = {
    id: string;
    layer: BaseLayer<any>;
    depth: number;
}

export type DropPosition = 'top' | 'bottom' | 'inside';

type LayerManagerState = {
    version: number;
    editingId: string | null;
    targetLayer: BaseLayer | null;

    refresh: () => void;
    getSelectedLayers: () => string[];
    getFlatView: (filter?: string) => LayerView[];
    setEditingId: (id: string | null) => void;
    setTargetLayer: (layer: BaseLayer | null) => void;
}

export const useLayerManagerStore = create<LayerManagerState>((set, get) => ({
    version: 0,
    editingId: null,
    targetLayer: null,

    refresh: () => set((state) => ({ version: state.version + 1 })),
    getSelectedLayers: () => {
        const tilemapSessionManager = AppCore.getIns().workspaceManager.currentWorkspace?.tilemapSessionManager;
        if (!tilemapSessionManager) return [];
        const currentSession = tilemapSessionManager.currentTilemapSession;
        if (!currentSession) return [];
        return currentSession.layerState.selectedLayers
    },
    getFlatView: (filter: string = '') => {
        const tilemapSessionManager = AppCore.getIns().workspaceManager.currentWorkspace?.tilemapSessionManager;
        if (!tilemapSessionManager) return [];
        const currentSession = tilemapSessionManager.currentTilemapSession;
        if (!currentSession) return [];
        const root = currentSession.tilemap.rootLayer;
        if (!root) return [];

        const result: LayerView[] = [];
        const term = filter.toLowerCase();
        const processLayer = (layer: BaseLayer, depth: number) => {
            const matches = layer.name.toLowerCase().includes(term);

            if (matches || !term) result.push({ id: layer.id, layer, depth });

            if (layer instanceof GroupLayer && layer.isOpen) {
                layer.layers.forEach(c => processLayer(c, depth + 1));
            }
        };

        root.layers.forEach(c => processLayer(c, 0));
        return result;
    },
    setEditingId: (id) => set({ editingId: id }),
    setTargetLayer: (layer) => set({ targetLayer: layer }),

}));