import { TilesetRefManager } from "@/core/manager/tilesetRefManager";
import { RootLayerData } from "@/shared/schema/layerSchema";
import { ErrorResult, Result, SuccessResult } from "@/shared/types/result";
import { LayerUtils } from "@/shared/utils/layerUtils";

import { Tilemap } from "../tilemap";
import { BaseLayer, BaseLayerEvents, IGroupLayer } from "./baseLayer";
import { GroupLayer } from "./groupLayer";

interface RootLayerEvents extends BaseLayerEvents {
    layerReordered: () => void;
    layerAdded: (layerId: string, index: number) => void;
    layerRemoved: (layerId: string, index: number) => void;
}

export class RootLayer extends BaseLayer<RootLayerEvents> implements IGroupLayer {
    public layers: BaseLayer[] = [];

    constructor(layersData: RootLayerData, tilesetRefManager: TilesetRefManager, public readonly tilemap: Tilemap) {
        super("root", tilesetRefManager, tilemap);

        layersData.forEach((layerData) => {
            const layer = LayerUtils.createLayeFromData(layerData, this, this.tilesetRefManager, tilemap);
            if (layer) this.layers.push(layer);
        });
    }

    public override serialize(): RootLayerData {
        return this.layers.map((layer) => layer.serialize());
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
        this.tilemap.eventEmitter.emit("onChange");

        return SuccessResult();
    }

    public insertLayer(newLayer: BaseLayer<any>, index: number): Result {
        if (index < 0) return ErrorResult("Invalid layer's index: " + index);

        newLayer.parentLayer = this;
        this.layers.splice(index, 0, newLayer);
        this.eventEmitter.emit("layerAdded", newLayer.id, index);
        this.tilemap.eventEmitter.emit("onChange");

        return SuccessResult();
    }

    public removeLayer(layerId: string): Result {
        const index = this.layers.findIndex(layer => layer.id === layerId);
        if (index === -1) return ErrorResult("Layer not found: " + layerId);

        this.layers.splice(index, 1);
        this.eventEmitter.emit("layerRemoved", layerId, index);
        this.tilemap.eventEmitter.emit("onChange");

        return SuccessResult();
    }

    public moveChild(id: string, offset: number) {
        const index = this.layers.findIndex(c => c.id === id);
        if (index === -1) return;

        const newIndex = index + offset;
        if (newIndex < 0 || newIndex >= this.layers.length) return;

        const [child] = this.layers.splice(index, 1);
        this.layers.splice(newIndex, 0, child);
        this.eventEmitter.emit("layerReordered");
        this.tilemap.eventEmitter.emit("onChange");
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

    getAllIds(): Set<string> {
        const ids = new Set<string>();
        this.traverse((layer) => { if (layer !== this) ids.add(layer.id) });
        return ids;
    }
}