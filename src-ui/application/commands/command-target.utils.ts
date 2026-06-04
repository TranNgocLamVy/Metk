import { IUndoableCommandContext } from "@/editor/interface/base-command.interface";
import { BaseObject } from "@/editor/model/base-object";
import { Tilemap } from "@/editor/model/tilemap/tilemap";
import { BaseLayer, IGroupLayer } from "@/editor/model/tilemap/layer/base-layer";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { RootLayer } from "@/editor/model/tilemap/layer/root-layer";

export type LayerContainer = (GroupLayer | RootLayer) & IGroupLayer;

export function getTilemapByObjectId(context: IUndoableCommandContext, tilemapObjectId: string): Tilemap | null {
    const tilemap = context.objectRegistry.get<BaseObject<any>>(tilemapObjectId) ?? null;
    return tilemap instanceof Tilemap ? tilemap : null;
}

export function getLayerByObjectId<TLayer extends BaseLayer<any> = BaseLayer<any>>(context: IUndoableCommandContext, layerObjectId: string): TLayer | null {
    const layer = context.objectRegistry.get<BaseLayer<any>>(layerObjectId) ?? null;
    return layer instanceof BaseLayer ? layer as TLayer : null;
}

export function isLayerContainer(layer: BaseLayer<any>): layer is LayerContainer {
    return layer instanceof GroupLayer || layer instanceof RootLayer;
}

export function resolveLayerInsertionParent(layer: BaseLayer<any>, root: RootLayer): LayerContainer {
    if (isLayerContainer(layer)) return layer;
    return (layer.parentLayer ?? root) as LayerContainer;
}

export function isLayerInTilemap(tilemap: Tilemap, layer: BaseLayer<any>): boolean {
    let found = false;
    tilemap.rootLayer.traverse((candidate) => {
        if (candidate === layer) found = true;
    });
    return found;
}
