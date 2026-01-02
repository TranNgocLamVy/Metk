import { create } from "zustand";

import { BaseLayer } from "@/core/application/tile/layer/baseLayer";
import { GroupLayer } from "@/core/application/tile/layer/groupLayer";
import { RootLayer } from "@/core/application/tile/layer/rootLayer";
import { TileLayer } from "@/core/application/tile/layer/tileLayer";

export type LayerView = {
    id: string;
    layer: BaseLayer<any>;
    depth: number;
}

export type DropPosition = 'top' | 'bottom' | 'inside';

type LayerManagerState = {
    root: RootLayer | null;
    version: number; // Used to trigger re-renders on deep class mutations
    selectedIds: Set<string>;
    editingId: string | null;
    targetLayer: BaseLayer | null;

    // Actions
    setRoot: (root: RootLayer | null) => void;
    setTargetLayer: (layer: BaseLayer | null) => void;
    refresh: () => void;
    selectLayer: (id: string, multi: boolean) => void;
    selectAll: () => void;
    deselectAll: () => void;
    getFlatView: (filter?: string) => LayerView[];

    // Bulk Actions
    moveLayers: (draggedIds: string[], targetId: string, position: DropPosition) => void;
    duplicateLayers: (ids: string[]) => void;
    removeLayers: (ids: string[]) => void;
    toggleVisibility: (ids: string[], force?: boolean) => void;
    toggleLock: (ids: string[], force?: boolean) => void;
    moveLayersUp: (ids: string[]) => void;
    moveLayersDown: (ids: string[]) => void;

    setEditingId: (id: string | null) => void;
}

export const useLayerManagerStore = create<LayerManagerState>((set, get) => ({
    root: null,
    version: 0,
    selectedIds: new Set(),
    editingId: null,
    targetLayer: null,

    setRoot: (root) => set({ root }),
    setTargetLayer: (layer) => set({ targetLayer: layer }),
    refresh: () => set((state) => ({ version: state.version + 1 })),
    selectLayer: (id: string, multi: boolean) => set((state) => {
        const newSet = new Set(multi ? state.selectedIds : []);
        if (newSet.has(id)) {
            if (multi) newSet.delete(id);
            else newSet.add(id);
        } else {
            newSet.add(id);
        }
        return { selectedIds: newSet };
    }),

    selectAll: () => {
        const { root } = get();
        if (!root) return;

        const allIds = root.getAllIds();
        set({ selectedIds: allIds });
    },

    deselectAll: () => set({ selectedIds: new Set() }),

    getFlatView: (filter: string = '') => {
        const { root } = get();
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

    // Bulk Move
    moveLayers: (draggedIds: string[], targetId: string, position: DropPosition) => {
        const { root } = get();
        if (!root) return;

        // FIX 1: Explicitly handle if target is the Root Layer itself
        // (root.findLayer searches children, so we must check root.id manually first if findLayer implementation excludes it)
        const targetLayer = root.id === targetId ? root : root.findLayer(targetId);
        
        if (!targetLayer) return;

        // Filter valid layers to move
        const layersToMove = draggedIds
            .map(id => root.findLayer(id))
            .filter((l): l is BaseLayer => {
                if (!l) return false;
                if (l.id === targetId) return false; // Cannot drop on self
                
                // Prevent cycle: Cannot move a parent into its own child
                // If target is root, it can't be a child of 'l' (unless 'l' is root, which is impossible here)
                if (targetLayer === root) return true;
                return !l.isAncestorOf(targetLayer as any);
            });

        if (layersToMove.length === 0) return;

        // 1. Remove all dragged layers from their current parents
        layersToMove.forEach(l => l.removeFromParent());

        // 2. Insert at new position
        if (position === 'inside' && (targetLayer instanceof GroupLayer || targetLayer instanceof RootLayer)) {
            // FIX 2: When dropping 'inside' (e.g. on Root background), APPEND to the end.
            // Original code used 'addLayer' which 'unsifted' (prepended) to the top.
            layersToMove.forEach(l => {
                targetLayer.insertLayer(l, targetLayer.layers.length);
            });
            // Ensure group is open if we drop inside it
            if (targetLayer instanceof GroupLayer && !targetLayer.isOpen) {
                targetLayer.toggleOpen(true);
            }
        } else {
            // Standard reordering (Top/Bottom) relative to a sibling
            const parent = targetLayer.parentLayer || root;
            
            // Safety check: ensure parent exists (Root's parent is null, but we handled Root above)
            if (parent) {
                const targetIndex = parent.getLayerIndex(targetLayer.id);
                if (targetIndex !== -1) {
                    const insertIndex = position === 'top' ? targetIndex : targetIndex + 1;
                    layersToMove.forEach((l, i) => parent.insertLayer(l, insertIndex + i));
                }
            }
        }
        
        set(state => ({ version: state.version + 1 }));
    },

    duplicateLayers: (ids: string[]) => {
        const { root } = get();
        if (!root) return;

        ids.forEach(id => {
            const layer = root.findLayer(id);
            layer?.duplicate();
        });
        set(state => ({ version: state.version + 1 }));
    },

    removeLayers: (ids: string[]) => {
        const { root } = get();
        if (!root) return;

        ids.forEach(id => {
            const layer = root.findLayer(id);
            layer?.removeFromParent();
        });
        set(state => ({ version: state.version + 1, selectedIds: new Set() }));
    },

    toggleVisibility: (ids: string[], force?: boolean) => {
        const { root } = get();
        if (!root) return;

        ids.forEach(id => {
            const layer = root.findLayer(id);
            layer?.toggleVisibility(force);
        });
        set(state => ({ version: state.version + 1 }));
    },

    toggleLock: (ids: string[], force?: boolean) => {
        const { root } = get();
        if (!root) return;

        ids.forEach(id => {
            const layer = root.findLayer(id);
            layer?.toggleLock(force);
        });
        set(state => ({ version: state.version + 1 }));
    },

    moveLayersUp: (ids: string[]) => {
        const { root } = get();
        if (!root) return;

        const layers = ids.map(id => root.findLayer(id)).filter((l): l is BaseLayer => !!l);
        if (layers.length === 0) return;

        const firstParent = layers[0].parentLayer;
        if (!layers.every(l => l.parentLayer === firstParent)) return; // Constraint: same parent

        // Sort top-down by index
        const parent = firstParent || root;
        layers.sort((a, b) => parent.layers.indexOf(a) - parent.layers.indexOf(b));

        layers.forEach(layer => {
            if (!layer.parentLayer) return; // Should allow root children logic? BaseLayer says parent is GroupLayer | null. Root children have parent=Root.
            const parent = layer.parentLayer;
            const index = parent.layers.indexOf(layer);
            if (index === -1) return;

            const prevSibling = parent.layers[index - 1];

            // Logic 1: Top of group -> Move outside above
            if (index === 0) {
                if (parent.parentLayer) { // Cannot move out of Root
                    const grandParent = parent.parentLayer;
                    const parentIndex = grandParent.layers.indexOf(parent as any);
                    layer.removeFromParent();
                    grandParent.insertLayer(layer, parentIndex);
                }
            }
            // Logic 2: Right below a group -> Move inside (bottom)
            else if (prevSibling instanceof GroupLayer) {
                layer.removeFromParent();
                // Insert at the end of the previous group's children
                prevSibling.insertLayer(layer, prevSibling.layers.length);
                if (!prevSibling.isOpen) prevSibling.isOpen = true; // Optional: auto open
            }
            // Standard Swap
            else {
                parent.moveChild(layer.id, -1);
            }
        });
        set(state => ({ version: state.version + 1 }));
    },

    moveLayersDown: (ids: string[]) => {
        const { root } = get();
        if (!root) return;

        const layers = ids.map(id => root.findLayer(id)).filter((l): l is BaseLayer => !!l);
        if (layers.length === 0) return;

        const firstParent = layers[0].parentLayer;
        if (!layers.every(l => l.parentLayer === firstParent)) return;

        const parent = firstParent || root;
        layers.sort((a, b) => parent.layers.indexOf(a) - parent.layers.indexOf(b));

        layers.forEach(layer => {
            if (!layer.parentLayer) return;
            const parent = layer.parentLayer;
            const index = parent.layers.indexOf(layer);
            if (index === -1) return;

            const nextSibling = parent.layers[index + 1];

            // Logic: Bottom of group -> Move outside below
            if (index === parent.layers.length - 1) {
                if (parent.parentLayer) {
                    const grandParent = parent.parentLayer;
                    const parentIndex = grandParent.layers.indexOf(parent as any);
                    layer.removeFromParent();
                    grandParent.insertLayer(layer, parentIndex + 1);
                }
            }
            // Logic: Right above a group -> Move inside (top)
            else if (nextSibling instanceof GroupLayer) {
                layer.removeFromParent();
                nextSibling.insertLayer(layer, 0); // Top of group
                if (!nextSibling.isOpen) nextSibling.isOpen = true;
            }
            // Standard Swap
            else {
                parent.moveChild(layer.id, 1);
            }
        });

        set(state => ({ version: state.version + 1 }));
    },

    setEditingId: (id) => set({ editingId: id })
}));