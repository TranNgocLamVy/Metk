import { LayerData } from "@/shared/schema/layerSchema";
import { ErrorResult, Result } from "@/shared/types/result";

import { BaseObject, BaseObjectEvents } from "../../baseObject";
import { TileLayer } from "./tileLayer";

export interface BaseLayerEvents extends BaseObjectEvents {

}

export class BaseLayer<T extends BaseLayerEvents = BaseLayerEvents> extends BaseObject<T> {
    public readonly id: string;
    protected name: string;

    constructor(id: string) {
        super();
        this.id = id;
    }

    public getName(): string {
        return this.name;
    }

    public rename(newName: string): void {
        this.name = newName;
        (this.eventEmitter as any).emit("updateProperty", "name", this.name);
    }

    public serialize(): any {
        throw new Error("Method not implemented.");
    }

    public clone(): Result<BaseLayer> {
        return ErrorResult("Not implemented yet!");
    }
}

export interface IGroupLayer {
    addLayer(newLayer: BaseLayer, index: number): Result;
    removeLayer(layerId: string): Result;
}