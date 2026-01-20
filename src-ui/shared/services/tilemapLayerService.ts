import { v4 as uuidv4 } from "uuid";

import { BaseLayer } from "@/core/application/tile/layer/baseLayer";
import { GroupLayer } from "@/core/application/tile/layer/groupLayer";
import { RootLayer } from "@/core/application/tile/layer/rootLayer";
import { TileLayer } from "@/core/application/tile/layer/tileLayer";
import { DropPosition, useLayerManagerStore } from "@/view/stores/application/layerManagerStore";

import { WorkspaceService } from "./workspaceService";

export class TilemapLayerService {
    public static async createNewTileLayer() {
        const currentSession = useLayerManagerStore.getState().currentSession;
        if (!currentSession) return;
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = useLayerManagerStore.getState().targetLayer;

        const parent = targetLayer instanceof GroupLayer ? targetLayer : (targetLayer?.parentLayer ? targetLayer.parentLayer : root);

        const newTileLayer = new TileLayer({
            id: uuidv4(),
            name: "New Tile Layer",
            layerType: "tile",
            width: root.tilemap.width,
            height: root.tilemap.height,
            opacity: 1,
            visible: true,
            locked: false,
            tilesData: []
        }, parent, parent.tilesetRefManager)

        parent.addLayer(newTileLayer);
        if (parent instanceof GroupLayer) parent.toggleOpen(true);

        useLayerManagerStore.getState().setEditingId(newTileLayer.id);
        useLayerManagerStore.getState().refresh()
    }

    public static async createNewGroupLayer() {
        const currentSession = useLayerManagerStore.getState().currentSession;
        if (!currentSession) return;
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = useLayerManagerStore.getState().targetLayer;

        const parent = targetLayer instanceof GroupLayer ? targetLayer : (targetLayer?.parentLayer ? targetLayer.parentLayer : root);

        const newGroupLayer = new GroupLayer({
            id: uuidv4(),
            name: "New Group Layer",
            layerType: "group",
            opacity: 1,
            visible: true,
            locked: false,
            layers: []
        }, parent, parent.tilesetRefManager)

        parent.addLayer(newGroupLayer);
        if (parent instanceof GroupLayer) parent.toggleOpen(true);

        useLayerManagerStore.getState().setEditingId(newGroupLayer.id);
        useLayerManagerStore.getState().refresh()
    }

    public static async duplicateLayer() {
        const currentSession = useLayerManagerStore.getState().currentSession;
        if (!currentSession) return;
        const root = currentSession.tilemap.rootLayer;
        const selectedIds = currentSession.layerState.selectedLayers;
        selectedIds.forEach(id => {
            const layer = root.findLayer(id);
            layer?.duplicate();
        });
        useLayerManagerStore.getState().refresh();
    }

    public static async deleteLayer() {
        const currentSession = useLayerManagerStore.getState().currentSession;
        if (!currentSession) return;
        const root = currentSession.tilemap.rootLayer;
        const selectedIds = useLayerManagerStore.getState().selectedIds
        selectedIds.forEach((id) => {
            const layer = root.findLayer(id);
            layer?.removeFromParent();
        })
        useLayerManagerStore.getState().refresh();
    }

    public static selectLayer(id: string, multi: boolean) {
        const currentSession = useLayerManagerStore.getState().currentSession;
        if (!currentSession) return;
        let selectedLayers = [...currentSession.layerState.selectedLayers];
        if (!multi) selectedLayers = [];
        if (selectedLayers.includes(id) && multi) {
            selectedLayers = selectedLayers.filter(layerId => layerId !== id);
        } else {
            selectedLayers.push(id);
        }
        currentSession.updateLayerState({ selectedLayers });
        useLayerManagerStore.getState().setSelectedLayers(selectedLayers);
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static selectAllLayers() {
        const currentSession = useLayerManagerStore.getState().currentSession;
        if (!currentSession) return;
        const root = currentSession.tilemap.rootLayer;
        const selectedLayers = Array.from(root.getAllIds());
        currentSession.updateLayerState({ selectedLayers });
        useLayerManagerStore.getState().setSelectedLayers(selectedLayers);
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static deselectAllLayers() {
        const currentSession = useLayerManagerStore.getState().currentSession;
        if (!currentSession) return;
        currentSession.updateLayerState({ selectedLayers: [] });
        useLayerManagerStore.getState().setSelectedLayers([]);
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });
    }

    public static toggleVisibility(ids: string[], force?: boolean) {
        const currentSession = useLayerManagerStore.getState().currentSession;
        if (!currentSession) return;
        const root = currentSession.tilemap.rootLayer;
        ids.forEach(id => {
            const layer = root.findLayer(id);
            layer?.toggleVisibility(force);
        });
        useLayerManagerStore.getState().refresh();
    }

    public static toggleLock(ids: string[], force?: boolean) {
        const currentSession = useLayerManagerStore.getState().currentSession;
        if (!currentSession) return;
        const root = currentSession.tilemap.rootLayer;
        ids.forEach(id => {
            const layer = root.findLayer(id);
            layer?.toggleLock(force);
        });
        useLayerManagerStore.getState().refresh();
    }

    public static moveLayers(draggedIds: string[], targetId: string, position: DropPosition) {
        const currentSession = useLayerManagerStore.getState().currentSession;
        if (!currentSession) return;
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.id === targetId ? root : root.findLayer(targetId);

        if (!targetLayer) return;

        const layersToMove = draggedIds
            .map(id => root.findLayer(id))
            .filter((l): l is BaseLayer => {
                if (!l) return false;
                if (l.id === targetId) return false; // Cannot drop on self
                if (targetLayer === root) return true;
                return !l.isAncestorOf(targetLayer as any);
            });

        if (layersToMove.length === 0) return;

        // 1. Remove all dragged layers from their current parents
        layersToMove.forEach(l => l.removeFromParent());

        if (position === 'inside' && (targetLayer instanceof GroupLayer || targetLayer instanceof RootLayer)) {
            layersToMove.forEach(l => {
                targetLayer.insertLayer(l, targetLayer.layers.length);
            });
            if (targetLayer instanceof GroupLayer && !targetLayer.isOpen) {
                targetLayer.toggleOpen(true);
            }
        } else {
            const parent = targetLayer.parentLayer || root;
            if (parent) {
                const targetIndex = parent.getLayerIndex(targetLayer.id);
                if (targetIndex !== -1) {
                    const insertIndex = position === 'top' ? targetIndex : targetIndex + 1;
                    layersToMove.forEach((l, i) => parent.insertLayer(l, insertIndex + i));
                }
            }
        }

        useLayerManagerStore.getState().refresh();
    }

    public static moveLayersUp() {
        const currentSession = useLayerManagerStore.getState().currentSession;
        if (!currentSession) return;
        const root = currentSession.tilemap.rootLayer;

        const ids = currentSession.layerState.selectedLayers;

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

        useLayerManagerStore.getState().refresh();
    }

    public static moveLayersDown() {
        const currentSession = useLayerManagerStore.getState().currentSession;
        if (!currentSession) return;
        const root = currentSession.tilemap.rootLayer;

        const ids = currentSession.layerState.selectedLayers;

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

        useLayerManagerStore.getState().refresh();
    }
}