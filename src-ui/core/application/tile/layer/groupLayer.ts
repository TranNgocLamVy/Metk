import { v4 as uuidv4 } from "uuid";

import { TilesetRefManager } from "@/core/manager/tilesetRefManager";
import { GroupLayerData } from "@/shared/schema/layerSchema";
import { ErrorResult, Result, SuccessResult } from "@/shared/types/result";
import { LayerUtils } from "@/shared/utils/layerUtils";

import { Tilemap } from "../tilemap";
import { BaseLayer, BaseLayerEvents, IGroupLayer } from "./baseLayer";

interface GroupLayerEvents extends BaseLayerEvents {
    layerReordered: () => void;
    layerAdded: (layerId: string, index: number) => void;
    layerRemoved: (layerId: string, index: number) => void;
}

export class GroupLayer extends BaseLayer<GroupLayerEvents> implements IGroupLayer {
    public layers: BaseLayer[] = [];
    public isOpen: boolean = false;

    constructor(groupLayerData: GroupLayerData, parentLayer: IGroupLayer | null, tilesetRefManager: TilesetRefManager) {
        super(groupLayerData.id, tilesetRefManager);

        if (parentLayer) this.parentLayer = parentLayer;

        this.name = groupLayerData.name;

        this.opacity = groupLayerData.opacity;
        this.visible = groupLayerData.visible;
        this.locked = groupLayerData.locked;

        groupLayerData.layers.forEach((layerData: any) => {
            const layer = LayerUtils.createLayeFromData(layerData, this, this.tilesetRefManager);
            if (layer) this.layers.push(layer);
        });
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

        return SuccessResult();
    }

    public insertLayer(newLayer: BaseLayer<any>, index: number): Result {
        if (index < 0) return ErrorResult("Invalid layer's index: " + index);

        newLayer.parentLayer = this;
        this.layers.splice(index, 0, newLayer);
        this.eventEmitter.emit("layerAdded", newLayer.id, index);

        return SuccessResult();
    }

    public removeLayer(layerId: string): Result {
        const index = this.layers.findIndex(layer => layer.id === layerId);
        if (index === -1) return ErrorResult("Layer not found: " + layerId);

        this.layers.splice(index, 1);
        this.eventEmitter.emit("layerRemoved", layerId, index);

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
    }

    public toggleOpen(force?: boolean): void {
        this.isOpen = force === undefined ? !this.isOpen : force;
    }

    public override traverse(cb: (layer: BaseLayer<any>) => void) {
        cb(this);
        this.layers.forEach(c => c.traverse(cb));
    }

    public override serialize(): GroupLayerData {
        return {
            id: this.id,
            layerType: "group",
            name: this.name,
            opacity: this.opacity,
            visible: this.visible,
            locked: this.locked,
            layers: this.layers.map((layer) => layer.serialize()),
        }
    }

    public override clone(): GroupLayer {
        const groupLayerData = this.serialize();
        groupLayerData.id = uuidv4();
        return new GroupLayer(groupLayerData, this.parentLayer, this.tilesetRefManager);
    }
}