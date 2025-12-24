import { GroupLayerData } from "@/shared/schema/layerSchema";
import { ErrorResult, Result, SuccessResult } from "@/shared/types/result";
import { LayerUtils } from "@/shared/utils/layerUtils";

import { BaseLayer, BaseLayerEvents, IGroupLayer } from "./baseLayer";

interface GroupLayerEvents extends BaseLayerEvents {
    layerReordered: () => void;
    layerAdded: (layerId: string, index: number) => void;
    layerRemoved: (layerId: string, index: number) => void;
}

export class GroupLayer extends BaseLayer<GroupLayerEvents> implements IGroupLayer {
    public parentLayer: IGroupLayer;
    private layers: BaseLayer[] = [];
    public opacity: number = 1;
    public visible: boolean = true;
    public locked: boolean = false;

    constructor(groupLayerData: GroupLayerData, parentLayer: IGroupLayer) {
        super(groupLayerData.id);

        this.parentLayer = parentLayer;

        this.name = groupLayerData.name;

        this.opacity = groupLayerData.opacity;
        this.visible = groupLayerData.visible;
        this.locked = groupLayerData.locked;

        groupLayerData.layers.forEach((layerData: any) => {
            const layer = LayerUtils.createLayeFromData(layerData, this);
            if (layer) this.layers.push(layer);
        });
    }

    public getLayers(): BaseLayer[] {
        return this.layers;
    }

    public override serialize(): any {
        return this.layers.map((layer) => layer.serialize());
    }

    public addLayer(newLayer: BaseLayer, index: number): Result {
        if (index < 0) return ErrorResult("Invalid layer's index: " + index);

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
}