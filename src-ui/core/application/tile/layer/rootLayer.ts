import { RootLayerData } from "@/shared/schema/layerSchema";
import { ErrorResult, Result, SuccessResult } from "@/shared/types/result";
import { LayerUtils } from "@/shared/utils/layerUtils";

import { BaseLayer, BaseLayerEvents, IGroupLayer } from "./baseLayer";

interface RootLayerEvents extends BaseLayerEvents {
    layerReordered: () => void;
    layerAdded: (layerId: string, index: number) => void;
    layerRemoved: (layerId: string, index: number) => void;
}

export class RootLayer extends BaseLayer<RootLayerEvents> implements IGroupLayer {
    private layers: BaseLayer[] = [];

    constructor(layersData: RootLayerData) {
        super("root");

        layersData.forEach((layerData) => {
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

    public addLayer(newLayer: BaseLayer<any>, index: number): Result {
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