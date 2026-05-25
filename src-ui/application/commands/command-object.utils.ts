import { EditorFacade } from "@/application/editor.facade";
import { BaseObject } from "@/editor/model/base-object";
import { Tilemap } from "@/editor/model/tilemap/tilemap";
import { BaseLayer, IGroupLayer } from "@/editor/model/tilemap/layer/base-layer";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { RootLayer } from "@/editor/model/tilemap/layer/root-layer";
import { TilemapSession } from "@/editor/session/tilemap.session";

export type RegisteredGroupLayer = (GroupLayer | RootLayer) & IGroupLayer;

export function getTilemapByObjectId(editorFacade: EditorFacade, tilemapObjectId: string): Tilemap | null {
    const tilemap = editorFacade.objectRegistry?.get<BaseObject<any>>(tilemapObjectId) ?? null;
    return tilemap instanceof Tilemap ? tilemap : null;
}

export function getLayerByObjectId<TLayer extends BaseLayer<any> = BaseLayer<any>>(editorFacade: EditorFacade, layerObjectId: string): TLayer | null {
    const layer = editorFacade.objectRegistry?.get<BaseLayer<any>>(layerObjectId) ?? null;
    return layer instanceof BaseLayer ? layer as TLayer : null;
}

export function isLayerContainer(layer: BaseLayer<any>): layer is RegisteredGroupLayer {
    return layer instanceof GroupLayer || layer instanceof RootLayer;
}

export function resolveLayerInsertionParent(layer: BaseLayer<any>, root: RootLayer): RegisteredGroupLayer {
    if (isLayerContainer(layer)) return layer;
    return (layer.parentLayer ?? root) as RegisteredGroupLayer;
}

export function isLayerInTilemap(tilemap: Tilemap, layer: BaseLayer<any>): boolean {
    let found = false;
    tilemap.rootLayer.traverse((candidate) => {
        if (candidate === layer) found = true;
    });
    return found;
}

export function getTilemapSessionByObjectId(editorFacade: EditorFacade, tilemapObjectId: string): TilemapSession | null {
    const tilemap = getTilemapByObjectId(editorFacade, tilemapObjectId);
    if (!tilemap) return null;
    return editorFacade.currentWorkspace?.tilemapSessionManager.getSessionByTilemapId(tilemap.id) ?? null;
}

export function markTilemapDirty(editorFacade: EditorFacade, tilemapObjectId: string): void {
    getTilemapSessionByObjectId(editorFacade, tilemapObjectId)?.markAsDirty();
}

export function markTilemapLayerChanged(editorFacade: EditorFacade, tilemapObjectId: string): void {
    getTilemapSessionByObjectId(editorFacade, tilemapObjectId)?.markLayerChange();
}

export function emitSelectedLayersChanged(editorFacade: EditorFacade, tilemapObjectId: string): void {
    const session = getTilemapSessionByObjectId(editorFacade, tilemapObjectId);
    if (!session) return;
    session.emit("onSelectedLayersChanged", session.layerState.selectedLayers);
}
