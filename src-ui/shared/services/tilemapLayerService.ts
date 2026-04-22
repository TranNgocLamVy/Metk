import { appCore } from "@/core/appcore";
import { BaseLayer } from "@/core/application/tile/layer/baseLayer";
import { GroupLayer } from "@/core/application/tile/layer/groupLayer";
import { RootLayer } from "@/core/application/tile/layer/rootLayer";
import { CreateTileLayerCommand } from "@/core/command/layer/createTileLayerCommand";
import { DeleteLayerCommand } from "@/core/command/layer/deleteLayerCommand";
import { DuplicateLayerCommand } from "@/core/command/layer/duplicateLayerCommand";
import { MoveLayerCommand } from "@/core/command/layer/moveLayerCommand";
import { RenameLayerCommand } from "@/core/command/layer/renameLayerCommand";
import { ToggleLayerLockCommand } from "@/core/command/layer/toggleLayerLockCommand";
import { ToggleLayerVisibilityCommand } from "@/core/command/layer/toggleLayerVisibilityCommand";
import { DropPosition, useLayerManagerStore } from "@/view/stores/layerManagerStore";

import { CreateGroupLayerCommand } from "../../core/command/layer/createGroupLayerCommand";
import { WorkspaceService } from "./workspaceService";
import { defaultGroupLayerData, defaultRuleLayerData, defaultTileLayerData } from "../schema/layerSchema";
import { CreateRuleLayerCommand } from "@/core/command/layer/createRuleLayerCommand";

export class TilemapLayerService {
    public static async createNewTileLayer() {
        const editorContext = appCore.editorContext;

        const currentSession = editorContext.getCurrentTilemapSession();
        const historyManager = editorContext.getCurrentHistoryManager();
        if (!currentSession || !historyManager) return;

        const root = currentSession.tilemap.rootLayer;

        const targetLayer = useLayerManagerStore.getState().targetLayer;

        const parent = targetLayer instanceof GroupLayer ? targetLayer : (targetLayer?.parentLayer ? targetLayer.parentLayer : root);

        const payload = defaultTileLayerData({ parentId: parent.id, width: currentSession.tilemap.width, height: currentSession.tilemap.height });

        const createTileLayerCommand = new CreateTileLayerCommand(payload, parent.id);

        historyManager.startTransaction();
        historyManager.execute(createTileLayerCommand, editorContext)
        historyManager.commitTransaction();

        useLayerManagerStore.getState().setEditingId(payload.id);
    }

    public static async createNewRuleLayer() {
        const editorContext = appCore.editorContext;

        const currentSession = editorContext.getCurrentTilemapSession();
        const historyManager = editorContext.getCurrentHistoryManager();
        if (!currentSession || !historyManager) return;

        const root = currentSession.tilemap.rootLayer;

        const targetLayer = useLayerManagerStore.getState().targetLayer;

        const parent = targetLayer instanceof GroupLayer ? targetLayer : (targetLayer?.parentLayer ? targetLayer.parentLayer : root);

        const payload = defaultRuleLayerData({ parentId: parent.id, width: currentSession.tilemap.width, height: currentSession.tilemap.height });

        const createRuleLayerCommand = new CreateRuleLayerCommand(payload, parent.id);

        historyManager.startTransaction();
        historyManager.execute(createRuleLayerCommand, editorContext)
        historyManager.commitTransaction();

        useLayerManagerStore.getState().setEditingId(payload.id);
    }

    public static async createNewGroupLayer() {
        const editorContext = appCore.editorContext;

        const currentSession = editorContext.getCurrentTilemapSession();
        const historyManager = editorContext.getCurrentHistoryManager();
        if (!currentSession || !historyManager) return;

        const root = currentSession.tilemap.rootLayer;

        const targetLayer = useLayerManagerStore.getState().targetLayer;

        const parent = targetLayer instanceof GroupLayer ? targetLayer : (targetLayer?.parentLayer ? targetLayer.parentLayer : root);

        const payload = defaultGroupLayerData({ parentId: parent.id });

        const createGroupLayerCommand = new CreateGroupLayerCommand(payload, parent.id);

        historyManager.startTransaction();
        historyManager.execute(createGroupLayerCommand, editorContext)
        historyManager.commitTransaction();

        useLayerManagerStore.getState().setEditingId(payload.id);
    }

    public static async duplicateLayer() {
       const editorContext = appCore.editorContext;

        const currentSession = editorContext.getCurrentTilemapSession();
        const historyManager = editorContext.getCurrentHistoryManager();
        if (!currentSession || !historyManager) return;

        const selectedIds = currentSession.layerState.selectedLayers;

        historyManager.startTransaction();
        selectedIds.forEach(id => {
            const duplicateLayerCommand = new DuplicateLayerCommand(id);
            historyManager.execute(duplicateLayerCommand, editorContext);
        });
        historyManager.commitTransaction();
    }

    public static async deleteLayer() {
        const editorContext = appCore.editorContext;

        const currentSession = editorContext.getCurrentTilemapSession();
        const historyManager = appCore.editorContext.getCurrentHistoryManager();
        if (!currentSession || !historyManager) return;

        const selectedIds = currentSession.layerState.selectedLayers;

        historyManager.startTransaction();
        selectedIds.forEach((id) => {
            const deleteLayerCommand = new DeleteLayerCommand(id);
            historyManager.execute(deleteLayerCommand, editorContext);
        })
        historyManager.commitTransaction();

        useLayerManagerStore.getState().refresh();
    }

    public static selectLayer(id: string, multi: boolean) {
        const tilemapSessionManager = appCore.workspaceManager.currentWorkspace?.tilemapSessionManager;
        if (!tilemapSessionManager) return;
        const currentSession = tilemapSessionManager.currentTilemapSession;
        if (!currentSession) return;
        let selectedLayers = [...currentSession.layerState.selectedLayers];
        if (!multi) selectedLayers = [];
        if (selectedLayers.includes(id) && multi) {
            selectedLayers = selectedLayers.filter(layerId => layerId !== id);
        } else {
            selectedLayers.push(id);
        }
        currentSession.updateLayerState({ selectedLayers });
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });

        useLayerManagerStore.getState().refresh();
    }

    public static selectAllLayers() {
        const tilemapSessionManager = appCore.workspaceManager.currentWorkspace?.tilemapSessionManager;
        if (!tilemapSessionManager) return;
        const currentSession = tilemapSessionManager.currentTilemapSession;
        if (!currentSession) return;
        const root = currentSession.tilemap.rootLayer;
        const selectedLayers = Array.from(root.getAllIds());
        currentSession.updateLayerState({ selectedLayers });
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });

        useLayerManagerStore.getState().refresh();
    }

    public static deselectAllLayers() {
        const tilemapSessionManager = appCore.workspaceManager.currentWorkspace?.tilemapSessionManager;
        if (!tilemapSessionManager) return;
        const currentSession = tilemapSessionManager.currentTilemapSession;
        if (!currentSession) return;
        currentSession.updateLayerState({ selectedLayers: [] });
        WorkspaceService.saveCurrentWorkspace({ waitForTimeout: false });

        useLayerManagerStore.getState().refresh();
    }

    public static toggleVisibility(ids: string[], force?: boolean) {
        const editorContext = appCore.editorContext;

        const currentSession = editorContext.getCurrentTilemapSession();
        const historyManager = editorContext.getCurrentHistoryManager();

        if (!currentSession || !historyManager) return;
        const root = currentSession.tilemap.rootLayer;

        historyManager.startTransaction();
        ids.forEach(id => {
            const layer = root.findLayer(id);
            if (!layer) return;
            const toggleVisibilityCommand = new ToggleLayerVisibilityCommand(id, force === undefined ? !layer.visible : force);
            historyManager.execute(toggleVisibilityCommand, editorContext);
        });
        historyManager.commitTransaction();

        useLayerManagerStore.getState().refresh();
    }

    public static toggleLock(ids: string[], force?: boolean) {
        const editorContext = appCore.editorContext;

        const currentSession = editorContext.getCurrentTilemapSession();
        const historyManager = editorContext.getCurrentHistoryManager();

        if (!currentSession || !historyManager) return;
        const root = currentSession.tilemap.rootLayer;

        historyManager.startTransaction();
        ids.forEach(id => {
            const layer = root.findLayer(id);
            if (!layer) return;
            const toggleLockCommand = new ToggleLayerLockCommand(id, force === undefined ? !layer.locked : force);
            historyManager.execute(toggleLockCommand, editorContext);
        });
        historyManager.commitTransaction();

        useLayerManagerStore.getState().refresh();
    }

    public static moveLayers(draggedIds: string[], targetId: string, position: DropPosition) {
        const editorContext = appCore.editorContext;

        const currentSession = editorContext.getCurrentTilemapSession();
        const historyManager = editorContext.getCurrentHistoryManager();

        if (!currentSession || !historyManager) return;
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.id === targetId ? root : root.findLayer(targetId);

        if (!targetLayer) return;

        const layersToMove = draggedIds
            .map(id => root.findLayer(id))
            .filter((l): l is BaseLayer => {
                if (!l) return false;
                if (l.id === targetId) return false;
                if (targetLayer === root) return true;
                return !l.isAncestorOf(targetLayer as any);
            });

        if (layersToMove.length === 0) return;

        if (position === 'inside' && (targetLayer instanceof GroupLayer || targetLayer instanceof RootLayer)) {
            historyManager.startTransaction();
            layersToMove.forEach(l => {
                const moveLayerCommand = new MoveLayerCommand(targetLayer.id, l.id, targetLayer.layers.length);
                historyManager.execute(moveLayerCommand, editorContext);
            });
            historyManager.commitTransaction();
        } else {
            const parent = targetLayer.parentLayer || root;
            if (parent) {
                const targetIndex = parent.getLayerIndex(targetLayer.id);
                if (targetIndex !== -1) {
                    const insertIndex = position === 'top' ? targetIndex : targetIndex + 1;
                    historyManager.startTransaction();
                    layersToMove.forEach((l, i) => {
                        const moveLayerCommand = new MoveLayerCommand(parent.id, l.id, insertIndex + i);
                        historyManager.execute(moveLayerCommand, editorContext);
                    });
                    historyManager.commitTransaction();
                }
            }
        }

        useLayerManagerStore.getState().refresh();
    }

    public static moveLayersUp() {
        const editorContext = appCore.editorContext;

        const currentSession = editorContext.getCurrentTilemapSession();
        const historyManager = editorContext.getCurrentHistoryManager();

        if (!currentSession || !historyManager) return;
        const root = currentSession.tilemap.rootLayer;

        const ids = currentSession.layerState.selectedLayers;

        const layers = ids.map(id => root.findLayer(id)).filter((l): l is BaseLayer => !!l);
        if (layers.length === 0) return;

        const firstParent = layers[0].parentLayer;
        if (!layers.every(l => l.parentLayer === firstParent)) return;

        const parent = firstParent || root;
        layers.sort((a, b) => parent.layers.indexOf(a) - parent.layers.indexOf(b));

        historyManager.startTransaction();
        layers.forEach(layer => {
            if (!layer.parentLayer) return;
            const parent = layer.parentLayer;
            const index = parent.layers.indexOf(layer);
            if (index === -1) return;

            const prevSibling = parent.layers[index - 1];

            if (index === 0) {
                if (parent.parentLayer) {
                    const grandParent = parent.parentLayer;
                    const parentIndex = grandParent.layers.indexOf(parent as any);
                    const moveLayerCommand = new MoveLayerCommand(grandParent.id, layer.id, parentIndex);
                    historyManager.execute(moveLayerCommand, editorContext);
                }
            } else if (prevSibling instanceof GroupLayer) {
                const moveLayerCommand = new MoveLayerCommand(prevSibling.id, layer.id, prevSibling.layers.length);
                historyManager.execute(moveLayerCommand, editorContext);
            } else {
                const moveLayerCommand = new MoveLayerCommand(parent.id, layer.id, index - 1);
                historyManager.execute(moveLayerCommand, editorContext);
            }
        });
        historyManager.commitTransaction();

        useLayerManagerStore.getState().refresh();
    }

    public static moveLayersDown() {
        const editorContext = appCore.editorContext;

        const currentSession = editorContext.getCurrentTilemapSession();
        const historyManager = editorContext.getCurrentHistoryManager();

        if (!currentSession || !historyManager) return;
        const root = currentSession.tilemap.rootLayer;

        const ids = currentSession.layerState.selectedLayers;

        const layers = ids.map(id => root.findLayer(id)).filter((l): l is BaseLayer => !!l);
        if (layers.length === 0) return;

        const firstParent = layers[0].parentLayer;
        if (!layers.every(l => l.parentLayer === firstParent)) return;

        const parent = firstParent || root;
        layers.sort((a, b) => parent.layers.indexOf(a) - parent.layers.indexOf(b));

        historyManager.startTransaction();
        layers.forEach(layer => {
            if (!layer.parentLayer) return;
            const parent = layer.parentLayer;
            const index = parent.layers.indexOf(layer);
            if (index === -1) return;

            const nextSibling = parent.layers[index + 1];

            if (index === parent.layers.length - 1) {
                if (parent.parentLayer) {
                    const grandParent = parent.parentLayer;
                    const parentIndex = grandParent.layers.indexOf(parent as any);
                    const moveLayerCommand = new MoveLayerCommand(grandParent.id, layer.id, parentIndex + 1);
                    historyManager.execute(moveLayerCommand, editorContext);
                }
            } else if (nextSibling instanceof GroupLayer) {
                const moveLayerCommand = new MoveLayerCommand(nextSibling.id, layer.id, 0);
                historyManager.execute(moveLayerCommand, editorContext);
            } else {
                const moveLayerCommand = new MoveLayerCommand(parent.id, layer.id, index + 1);
                historyManager.execute(moveLayerCommand, editorContext);
            }
        });
        historyManager.commitTransaction();

        useLayerManagerStore.getState().refresh();
    }

    public static renameLayer(id: string, name: string, recordUndo: boolean = true) {
        const editorContext = appCore.editorContext;

        const currentSession = editorContext.getCurrentTilemapSession();
        const historyManager = editorContext.getCurrentHistoryManager();
        if (!currentSession || !historyManager) return;

        if (recordUndo) {
            const renameLayerCommand = new RenameLayerCommand(id, name);
            historyManager.execute(renameLayerCommand, editorContext);
        } else {
            const root = currentSession.tilemap.rootLayer;
            const layer = root.findLayer(id);
            if (!layer) return;
            layer.rename(name);
        }

        useLayerManagerStore.getState().refresh();
    }
}