import { appKernel } from "@/application/bootstrap/app-kernel";
import { CreateTileLayerCommand } from "@/application/commands/layer/create-tile-layer.command";
import { CreateEntityLayerCommand } from "@/application/commands/layer/create-entity-layer.command";
import { DeleteLayerCommand } from "@/application/commands/layer/delete-layer.command";
import { DuplicateLayerCommand } from "@/application/commands/layer/duplicate-layer.command";
import { MoveLayerCommand } from "@/application/commands/layer/move-layer.command";
import { UpdatePropertyCommand } from "@/application/commands/update-property.command";
import { DropPosition, useLayerManagerStore } from "@/ui/stores/layer-manager.store";

import { CreateGroupLayerCommand } from "@/application/commands/layer/create-group-layer.command";
import { saveCurrentWorkspace } from "@/application/actions/workspace.actions";
import { defaultGroupLayerData, defaultImageLayerData, defaultRuleLayerData, defaultTileLayerData, defaultEntityLayerData, } from "@/shared/data-types/layer.data";
import { CreateRuleLayerCommand } from "@/application/commands/layer/create-rule-layer.command";
import { BaseLayer, IGroupLayer } from "@/editor/model/tilemap/layer/base-layer";
import { Tilemap } from "@/editor/model/tilemap/tilemap";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { RootLayer } from "@/editor/model/tilemap/layer/root-layer";
import { CreateImageLayerCommand } from "@/application/commands/layer/create-image-layer.command";

const getLayerVisualOrder = (root: RootLayer): Map<string, number> => {
    const order = new Map<string, number>();
    root.getAllLayers().forEach((layer, index) => order.set(layer.id, index));
    return order;
};

const removeDraggedDescendants = (layers: BaseLayer[]): BaseLayer[] => {
    return layers.filter(layer => !layers.some(candidate => candidate.id !== layer.id && candidate.isAncestorOf(layer)));
};

const getMoveCommandIndex = (parent: IGroupLayer, layer: BaseLayer, desiredIndex: number): number => {
    if (layer.parentLayer !== parent) return desiredIndex;

    const currentIndex = parent.getLayerIndex(layer.id);
    if (currentIndex === -1) return desiredIndex;

    return currentIndex < desiredIndex ? desiredIndex - 1 : desiredIndex;
};

export function getSelectedParentLayer(tilemap: Tilemap): IGroupLayer | null {
        const selectedIds = Array.from(useLayerManagerStore.getState().selectedLayers).reverse();
        
        for (const id of selectedIds) {
            const layer = tilemap.rootLayer.findLayer(id);
            if (layer instanceof GroupLayer) return layer;
        }

        return null;        
    }
    
export async function createNewTileLayer() {
        const editorFacade = appKernel.editorFacade;

        const currentSession = editorFacade.getActiveTilemapSession();
        if (!currentSession) return;
        const historyManager = currentSession.historyManager;

        const root = currentSession.tilemap.rootLayer;
        const targetLayer = getSelectedParentLayer(currentSession.tilemap);

        const parent = targetLayer instanceof GroupLayer ? targetLayer : (targetLayer?.parentLayer ? targetLayer.parentLayer : root);

        const payload = defaultTileLayerData({ width: currentSession.tilemap.width, height: currentSession.tilemap.height });

        const createTileLayerCommand = new CreateTileLayerCommand(currentSession.tilemap.objectId, parent.objectId, payload);

        historyManager.startTransaction();
        historyManager.execute(createTileLayerCommand, currentSession)
        historyManager.commitTransaction();

        useLayerManagerStore.getState().setEditingId(payload.id);
    }

export async function createNewRuleLayer() {
        const editorFacade = appKernel.editorFacade;

        const currentSession = editorFacade.getActiveTilemapSession();
        if (!currentSession) return;
        const historyManager = currentSession.historyManager;

        const root = currentSession.tilemap.rootLayer;
        const targetLayer = getSelectedParentLayer(currentSession.tilemap);

        const parent = targetLayer instanceof GroupLayer ? targetLayer : (targetLayer?.parentLayer ? targetLayer.parentLayer : root);

        const payload = defaultRuleLayerData({ width: currentSession.tilemap.width, height: currentSession.tilemap.height });

        const createRuleLayerCommand = new CreateRuleLayerCommand(currentSession.tilemap.objectId, parent.objectId, payload);

        historyManager.startTransaction();
        historyManager.execute(createRuleLayerCommand, currentSession)
        historyManager.commitTransaction();

        useLayerManagerStore.getState().setEditingId(payload.id);
    }

export async function createNewImageLayer() {
        const editorFacade = appKernel.editorFacade;
    
        const currentSession = editorFacade.getActiveTilemapSession();
        if (!currentSession) return;
        const historyManager = currentSession.historyManager;

        const tilemap = currentSession.tilemap;
        const root = tilemap.rootLayer;
        const targetLayer = getSelectedParentLayer(tilemap);
    
        const parent = targetLayer instanceof GroupLayer ? targetLayer : targetLayer?.parentLayer ? targetLayer.parentLayer : root;
    
        const payload = defaultImageLayerData();
    
        const createImageLayerCommand = new CreateImageLayerCommand(tilemap.objectId, parent.objectId, payload);
    
        historyManager.startTransaction();
        historyManager.execute(createImageLayerCommand, currentSession);
        historyManager.commitTransaction();
    
        useLayerManagerStore.getState().setEditingId(payload.id);
    }

export async function createNewEntityLayer() {
        const editorFacade = appKernel.editorFacade;
    
        const currentSession = editorFacade.getActiveTilemapSession();
        if (!currentSession) return;
        const historyManager = currentSession.historyManager;
    
        const tilemap = currentSession.tilemap;
        const root = tilemap.rootLayer;
        const targetLayer = getSelectedParentLayer(tilemap);
    
        const parent = targetLayer instanceof GroupLayer ? targetLayer : targetLayer?.parentLayer ? targetLayer.parentLayer : root;
    
        const payload = defaultEntityLayerData();
    
        const createEntityLayerCommand = new CreateEntityLayerCommand(
            tilemap.objectId,
            parent.objectId,
            payload,
        );
    
        historyManager.startTransaction();
        historyManager.execute(createEntityLayerCommand, currentSession);
        historyManager.commitTransaction();
    
        useLayerManagerStore.getState().setEditingId(payload.id);
    }

export async function createNewGroupLayer() {
        const editorFacade = appKernel.editorFacade;

        const currentSession = editorFacade.getActiveTilemapSession();
        if (!currentSession) return;
        const historyManager = currentSession.historyManager;

        const root = currentSession.tilemap.rootLayer;
        const targetLayer = getSelectedParentLayer(currentSession.tilemap);

        const parent = targetLayer instanceof GroupLayer ? targetLayer : (targetLayer?.parentLayer ? targetLayer.parentLayer : root);

        const payload = defaultGroupLayerData();

        const createGroupLayerCommand = new CreateGroupLayerCommand(currentSession.tilemap.objectId, parent.objectId, payload);

        historyManager.startTransaction();
        historyManager.execute(createGroupLayerCommand, currentSession)
        historyManager.commitTransaction();

        useLayerManagerStore.getState().setEditingId(payload.id);
    }

export async function duplicateLayer() {
       const editorFacade = appKernel.editorFacade;

        const currentSession = editorFacade.getActiveTilemapSession();
        if (!currentSession) return;
        const historyManager = currentSession.historyManager;

        const selectedIds = currentSession.layerState.selectedLayers;

        historyManager.startTransaction();
        selectedIds.forEach(id => {
            const layer = currentSession.tilemap.rootLayer.findLayer(id);
            if (!layer) return;
            const duplicateLayerCommand = new DuplicateLayerCommand(currentSession.tilemap.objectId, layer.objectId);
            historyManager.execute(duplicateLayerCommand, currentSession);
        });
        historyManager.commitTransaction();
    }

export async function deleteLayer() {
        const editorFacade = appKernel.editorFacade;

        const currentSession = editorFacade.getActiveTilemapSession();
        if (!currentSession) return;
        const historyManager = currentSession.historyManager;

        const selectedIds = currentSession.layerState.selectedLayers;

        historyManager.startTransaction();
        selectedIds.forEach((id) => {
            const layer = currentSession.tilemap.rootLayer.findLayer(id);
            if (!layer) return;
            const deleteLayerCommand = new DeleteLayerCommand(currentSession.tilemap.objectId, layer.objectId);
            historyManager.execute(deleteLayerCommand, currentSession);
        })
        historyManager.commitTransaction();

        const layers = Array.from(currentSession.tilemap.rootLayer.getAllIds());
        const selectedLayers = currentSession.layerState.selectedLayers;
        currentSession.updateLayerState({ selectedLayers: layers.filter(id => selectedLayers.includes(id)) });
    }

export function selectLayer(id: string, multi: boolean) {
        const tilemapSessionManager = appKernel.workspaceManager.currentWorkspace?.tilemapSessionManager;
        if (!tilemapSessionManager) return;
        const currentSession = tilemapSessionManager.activeSession;
        if (!currentSession) return;
        let selectedLayers = [...currentSession.layerState.selectedLayers];
        if (!multi) selectedLayers = [];
        if (selectedLayers.includes(id) && multi) {
            selectedLayers = selectedLayers.filter(layerId => layerId !== id);
        } else {
            selectedLayers.push(id);
        }
        currentSession.updateLayerState({ selectedLayers });
        saveCurrentWorkspace({ waitForTimeout: false });
    }

export function selectAllLayers() {
        const tilemapSessionManager = appKernel.workspaceManager.currentWorkspace?.tilemapSessionManager;
        if (!tilemapSessionManager) return;
        const currentSession = tilemapSessionManager.activeSession;
        if (!currentSession) return;
        const root = currentSession.tilemap.rootLayer;
        const selectedLayers = Array.from(root.getAllIds());
        currentSession.updateLayerState({ selectedLayers });
        saveCurrentWorkspace({ waitForTimeout: false });
    }

export function deselectAllLayers() {
        const tilemapSessionManager = appKernel.workspaceManager.currentWorkspace?.tilemapSessionManager;
        if (!tilemapSessionManager) return;
        const currentSession = tilemapSessionManager.activeSession;
        if (!currentSession) return;
        currentSession.updateLayerState({ selectedLayers: [] });
        saveCurrentWorkspace({ waitForTimeout: false });
    }

export function toggleSelectedLayersVisibility() {
        const editorFacade = appKernel.editorFacade;
        const currentSession = editorFacade.getActiveTilemapSession();
        if (!currentSession) return;
        const selectedIds = currentSession.layerState.selectedLayers;
        toggleVisibility(selectedIds);
    }

export function toggleNonSelectedLayersVisibility() {
        const editorFacade = appKernel.editorFacade;
        const currentSession = editorFacade.getActiveTilemapSession();
        if (!currentSession) return;
        const root = currentSession.tilemap.rootLayer;
        const selectedIds = currentSession.layerState.selectedLayers;
        const nonSelectedIds = Array.from(root.getAllIds()).filter(id => !selectedIds.includes(id));
        toggleVisibility(nonSelectedIds);
    }

export function toggleVisibility(ids: string[], force?: boolean) {
        const editorFacade = appKernel.editorFacade;

        const currentSession = editorFacade.getActiveTilemapSession();
        if (!currentSession) return;
        const historyManager = currentSession.historyManager;
        const root = currentSession.tilemap.rootLayer;

        historyManager.startTransaction();
        ids.forEach(id => {
            const layer = root.findLayer(id);
            if (!layer) return;
            const property = layer.properties.get("_visible");
            if (!property) return;

            const oldValue = property.getter();
            const newValue = force === undefined ? !oldValue : force;
            const toggleVisibilityCommand = new UpdatePropertyCommand(layer.objectId, "_visible", oldValue, newValue);
            historyManager.execute(toggleVisibilityCommand, currentSession);
        });
        historyManager.commitTransaction();
    }

export function toggleOpenGroupLayer(id: string, force?: boolean) {
        const editorFacade = appKernel.editorFacade;

        const currentSession = editorFacade.getActiveTilemapSession();

        if (!currentSession) return;
        const root = currentSession.tilemap.rootLayer;
        const targetLayer = root.findLayer(id);
        if (!targetLayer) return;
        if (!(targetLayer instanceof GroupLayer)) return;

        const property = targetLayer.properties.get("isOpen");
        if (!property) return;

        const oldValue = property.getter();
        const newValue = force === undefined ? !oldValue : force;
        const toggleOpenGroupLayerCommand = new UpdatePropertyCommand(targetLayer.objectId, "isOpen", oldValue, newValue);
        toggleOpenGroupLayerCommand.execute(currentSession);
    }

export function toggleSelectedLayersLock() {
        const editorFacade = appKernel.editorFacade;
        const currentSession = editorFacade.getActiveTilemapSession();
        if (!currentSession) return;
        const selectedIds = currentSession.layerState.selectedLayers;
        toggleLock(selectedIds);
    }

export function toggleNonSelectedLayersLock() {
        const editorFacade = appKernel.editorFacade;
        const currentSession = editorFacade.getActiveTilemapSession();
        if (!currentSession) return;
        const root = currentSession.tilemap.rootLayer;
        const selectedIds = currentSession.layerState.selectedLayers;
        const nonSelectedIds = Array.from(root.getAllIds()).filter(id => !selectedIds.includes(id));
        toggleLock(nonSelectedIds);
    }

export function toggleLock(ids: string[], force?: boolean) {
        const editorFacade = appKernel.editorFacade;

        const currentSession = editorFacade.getActiveTilemapSession();
        if (!currentSession) return;
        const historyManager = currentSession.historyManager;
        const root = currentSession.tilemap.rootLayer;

        historyManager.startTransaction();
        ids.forEach(id => {
            const layer = root.findLayer(id);
            if (!layer) return;
            const property = layer.properties.get("_locked");
            if (!property) return;

            const oldValue = property.getter();
            const newValue = force === undefined ? !oldValue : force;
            const toggleLockCommand = new UpdatePropertyCommand(layer.objectId, "_locked", oldValue, newValue);
            historyManager.execute(toggleLockCommand, currentSession);
        });
        historyManager.commitTransaction();
    }

export function moveLayers(draggedIds: string[], targetId: string, position: DropPosition) {
        const editorFacade = appKernel.editorFacade;

        const currentSession = editorFacade.getActiveTilemapSession();
        if (!currentSession) return;
        const historyManager = currentSession.historyManager;
        const root = currentSession.tilemap.rootLayer;

        const targetLayer = root.id === targetId ? root : root.findLayer(targetId);

        if (!targetLayer) return;

        const visualOrder = getLayerVisualOrder(root);
        const requestedIds = new Set(draggedIds);
        const layersToMove = removeDraggedDescendants(
            Array.from(requestedIds)
                .map(id => root.findLayer(id))
                .filter((layer): layer is BaseLayer => {
                    if (!layer) return false;
                    if (layer.id === targetId) return false;
                    if (targetLayer === root) return true;
                    return !layer.isAncestorOf(targetLayer as BaseLayer);
                })
                .sort((a, b) => (visualOrder.get(a.id) ?? 0) - (visualOrder.get(b.id) ?? 0))
        );

        if (layersToMove.length === 0) return;

        if (position === 'inside' && (targetLayer instanceof GroupLayer || targetLayer instanceof RootLayer)) {
            historyManager.startTransaction();
            layersToMove.forEach(l => {
                const insertIndex = getMoveCommandIndex(targetLayer, l, targetLayer.layers.length);
                const moveLayerCommand = new MoveLayerCommand(currentSession.tilemap.objectId, targetLayer.objectId, l.objectId, insertIndex);
                historyManager.execute(moveLayerCommand, currentSession);
            });
            historyManager.commitTransaction();
        } else {
            const parent = targetLayer.parentLayer || root;
            if (parent) {
                historyManager.startTransaction();
                layersToMove.forEach((l, i) => {
                    const targetIndex = parent.getLayerIndex(targetLayer.id);
                    if (targetIndex !== -1) {
                        const desiredIndex = position === 'top' ? targetIndex : targetIndex + 1 + i;
                        const insertIndex = getMoveCommandIndex(parent, l, desiredIndex);
                        const moveLayerCommand = new MoveLayerCommand(currentSession.tilemap.objectId, parent.objectId, l.objectId, insertIndex);
                        historyManager.execute(moveLayerCommand, currentSession);
                    }
                });
                historyManager.commitTransaction();
            }
        }
    }

export function moveLayersUp() {
        const editorFacade = appKernel.editorFacade;

        const currentSession = editorFacade.getActiveTilemapSession();
        if (!currentSession) return;
        const historyManager = currentSession.historyManager;
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
                    const moveLayerCommand = new MoveLayerCommand(currentSession.tilemap.objectId, grandParent.objectId, layer.objectId, parentIndex);
                    historyManager.execute(moveLayerCommand, currentSession);
                }
            } else if (prevSibling instanceof GroupLayer) {
                const moveLayerCommand = new MoveLayerCommand(currentSession.tilemap.objectId, prevSibling.objectId, layer.objectId, prevSibling.layers.length);
                historyManager.execute(moveLayerCommand, currentSession);
            } else {
                const moveLayerCommand = new MoveLayerCommand(currentSession.tilemap.objectId, parent.objectId, layer.objectId, index - 1);
                historyManager.execute(moveLayerCommand, currentSession);
            }
        });
        historyManager.commitTransaction();
    }

export function moveLayersDown() {
        const editorFacade = appKernel.editorFacade;

        const currentSession = editorFacade.getActiveTilemapSession();
        if (!currentSession) return;
        const historyManager = currentSession.historyManager;
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
                    const moveLayerCommand = new MoveLayerCommand(currentSession.tilemap.objectId, grandParent.objectId, layer.objectId, parentIndex + 1);
                    historyManager.execute(moveLayerCommand, currentSession);
                }
            } else if (nextSibling instanceof GroupLayer) {
                const moveLayerCommand = new MoveLayerCommand(currentSession.tilemap.objectId, nextSibling.objectId, layer.objectId, 0);
                historyManager.execute(moveLayerCommand, currentSession);
            } else {
                const moveLayerCommand = new MoveLayerCommand(currentSession.tilemap.objectId, parent.objectId, layer.objectId, index + 1);
                historyManager.execute(moveLayerCommand, currentSession);
            }
        });
        historyManager.commitTransaction();
    }

export function renameLayer(id: string, name: string, recordUndo: boolean = true) {
        const editorFacade = appKernel.editorFacade;

        const currentSession = editorFacade.getActiveTilemapSession();
        if (!currentSession) return;
        const historyManager = currentSession.historyManager;

        const root = currentSession.tilemap.rootLayer;
        const layer = root.findLayer(id);
        if (!layer) return;

        const command = new UpdatePropertyCommand(layer.objectId, "name", layer.name, name);

        if (recordUndo) {
            historyManager.execute(command, currentSession);
        } else {
            command.execute(currentSession);
        }
    }
