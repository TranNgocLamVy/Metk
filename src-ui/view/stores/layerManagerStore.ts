import { create } from "zustand";

import { TilemapSession } from "@/core/application/session/tilemapSession";
import { BaseLayer } from "@/core/application/tile/layer/baseLayer";
import { GroupLayer } from "@/core/application/tile/layer/groupLayer";

export type LayerView = {
    id: string;
    layer: BaseLayer<any>;
    depth: number;
}

export type DropPosition = 'top' | 'bottom' | 'inside';

type LayerManagerState = {
    currentSession: TilemapSession | null;
    version: number; // Used to trigger re-renders on deep class mutations
    selectedIds: string[];
    editingId: string | null;
    targetLayer: BaseLayer | null;

    // Actions
    setSession: (session: TilemapSession | null) => void;
    setTargetLayer: (layer: BaseLayer | null) => void;
    refresh: () => void;
    setSelectedLayers: (ids: string[]) => void;
    getFlatView: (filter?: string) => LayerView[];

    setEditingId: (id: string | null) => void;
}

export const useLayerManagerStore = create<LayerManagerState>((set, get) => ({
    currentSession: null,
    version: 0,
    selectedIds: [],
    editingId: null,
    targetLayer: null,

    setSession: (session) => {
        if (session) {
            set({ currentSession: session, selectedIds: session.layerState.selectedLayers })
        } else {
            set({ currentSession: null });
        }
    },
    setTargetLayer: (layer) => set({ targetLayer: layer }),
    refresh: () => set((state) => ({ version: state.version + 1 })),
    setSelectedLayers: (ids) => set({ selectedIds: [...ids] }),

    getFlatView: (filter: string = '') => {
        const currentSession = get().currentSession;
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

    setEditingId: (id) => set({ editingId: id })
}));