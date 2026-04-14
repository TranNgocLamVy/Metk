import { TilesetRefManager } from "@/core/manager/tilesetRefManager";
import { RootLayerData } from "@/shared/schema/layerSchema";
import { Result } from "@/shared/types/result";
import { LayerUtils } from "@/shared/utils/layerUtils";

import { BaseLayer, BaseLayerEvents, IGroupLayer } from "./baseLayer";
import { GroupLayer } from "./groupLayer";

interface RootLayerEvents extends BaseLayerEvents {
    layerReordered: () => void;
    layerAdded: (layerId: string, index: number) => void;
    layerRemoved: (layerId: string, index: number) => void;
}

export class RootLayer extends BaseLayer<RootLayerEvents> implements IGroupLayer {
    public layers: BaseLayer[] = [];

    constructor(layersData: RootLayerData, tilesetRefManager: TilesetRefManager) {
        super("root", tilesetRefManager);

        const groupLayerMap: Map<string, IGroupLayer> = new Map([["root", this]]);
        
        layersData.forEach((layerData) => {
            const parentLayer = groupLayerMap.get(layerData.parentId) ?? this;
            const layer = LayerUtils.createLayeFromData(layerData, parentLayer, this.tilesetRefManager);
            if (layer) {
                parentLayer.pushLayer(layer)
                if (layer instanceof GroupLayer) groupLayerMap.set(layer.id, layer);
            }
        });
    }

    public override serialize(): RootLayerData {
        return this.getAllLayers().map((layer) => layer.serialize());
    }

    public getLayers(): BaseLayer<any>[] {
        return this.layers;
    }

    public getLayerIndex(layerId: string): number {
        return this.layers.findIndex(layer => layer.id === layerId);
    }

    public addLayer(newLayer: BaseLayer<any>): Result {
        newLayer.parentLayer = this;
        this.layers.unshift(newLayer);
        this.eventEmitter.emit("layerAdded", newLayer.id, this.layers.length - 1);

        return Result.Success();
    }

    public pushLayer(newLayer: BaseLayer<any>): Result {
        newLayer.parentLayer = this;
        this.layers.push(newLayer);
        this.eventEmitter.emit("layerAdded", newLayer.id, this.layers.length - 1);

        return Result.Success();
    }

    public insertLayer(newLayer: BaseLayer<any>, index: number): Result {
        if (index < 0) return Result.Error("Invalid layer's index: " + index);

        newLayer.parentLayer = this;
        this.layers.splice(index, 0, newLayer);
        this.eventEmitter.emit("layerAdded", newLayer.id, index);

        return Result.Success();
    }

    public removeLayer(layerId: string): Result {
        const index = this.layers.findIndex(layer => layer.id === layerId);
        if (index === -1) return Result.Error("Layer not found: " + layerId);

        this.layers.splice(index, 1);
        this.eventEmitter.emit("layerRemoved", layerId, index);

        return Result.Success();
    }

    public moveChild(id: string, offset: number) {
        const index = this.layers.findIndex(c => c.id === id);
        if (index === -1) return;

        const newIndex = index + offset;
        if (newIndex < 0 || newIndex >= this.layers.length) return;

        const [child] = this.layers.splice(index, 1);
        this.layers.splice(newIndex, 0, child);
        this.eventEmitter.emit("layerReordered");
    }

    public override traverse(cb: (layer: BaseLayer<any>) => void) {
        cb(this);
        this.layers.forEach(c => c.traverse(cb));
    }

    public findLayer(id: string): BaseLayer<any> | null {
        if (this.id === id) return this;

        let found: BaseLayer | null = null;
        const search = (layer: BaseLayer) => {
            if (found) return;
            if (layer.id === id) found = layer;
            if (layer instanceof GroupLayer) layer.layers.forEach(search);
        };
        this.layers.forEach(search);
        return found;
    }

    public getAllLayers(): BaseLayer<any>[] {
        const allLayers: BaseLayer<any>[] = [];
        this.traverse((layer) => { if (layer !== this) allLayers.push(layer) });
        return allLayers;
    }

    public getAllIds(): Set<string> {
        const ids = new Set<string>();
        this.traverse((layer) => { if (layer !== this) ids.add(layer.id) });
        return ids;
    }
}