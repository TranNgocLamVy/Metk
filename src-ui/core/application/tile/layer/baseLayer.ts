import { TilesetRefManager } from "@/core/manager/tilesetRefManager";
import { LayerData } from "@/shared/schema/layerSchema";
import { ErrorResult, Result, SuccessResult } from "@/shared/types/result";

import { BaseObject, BaseObjectEvents } from "../../baseObject";
import { GroupLayer } from "./groupLayer";
import { RootLayer } from "./rootLayer";
import { TileLayer } from "./tileLayer";

export interface BaseLayerEvents extends BaseObjectEvents {

}

export class BaseLayer<T extends BaseLayerEvents = BaseLayerEvents> extends BaseObject<T> {
    public readonly id: string;
    public name: string;
    public opacity: number = 1;
    public visible: boolean = true;
    public locked: boolean = false;

    public parentLayer: IGroupLayer;

    constructor(id: string, public readonly tilesetRefManager: TilesetRefManager) {
        super();
        this.id = id;
    }

    public rename(newName: string): void {
        this.name = newName;
        (this.eventEmitter as any).emit("updateProperty", "name", this.name);
    }

    public toggleVisibility(force?: boolean): void {
        this.visible = force !== undefined ? force : !this.visible;
        (this.eventEmitter as any).emit("updateProperty", "visible", this.visible);
    }

    public toggleLock(force?: boolean): void {
        this.locked = force !== undefined ? force : !this.locked;
        (this.eventEmitter as any).emit("updateProperty", "locked", this.locked);
    }

    public updateOpacity(newOpacity: number): void {
        this.opacity = newOpacity;
        (this.eventEmitter as any).emit("updateProperty", "opacity", this.opacity);
    }

    public removeFromParent() {
        if (this.parentLayer) this.parentLayer.removeLayer(this.id);
    }

    public duplicate(): Result {
        if (!this.parentLayer) return ErrorResult("Parent layer not found.");

        const index = this.parentLayer.getLayerIndex(this.id);
        if (index == -1) return ErrorResult("Layer not found.");

        const clone = this.clone();

        this.parentLayer.insertLayer(clone, index + 1);
        return SuccessResult();
    }

    public isAncestorOf(potentialChild: BaseLayer): boolean {
        // If they are the same, it's technically an ancestor in this context (to prevent self-target)
        if (this.id === potentialChild.id) return true;

        // Traverse up the parent chain of the potentialChild
        let current = potentialChild.parentLayer;
        while (current) {
            if (current.id === this.id) return true;
            if (!current.parentLayer) return false;
            current = current.parentLayer;
        }
        return false;
    }

    public traverse(cb: (layer: BaseLayer<any>) => void): void {
        throw new Error("Method not implemented.");
    }

    public serialize(): any {
        throw new Error("Method not implemented.");
    }

    public clone(): BaseLayer<any> {
        throw new Error("Method not implemented.");
    }
}

export interface IGroupLayer {
    id: string;
    parentLayer: IGroupLayer | null;
    tilesetRefManager: TilesetRefManager
    layers: BaseLayer<any>[];
    getLayerIndex(layerId: string): number;
    addLayer(newLayer: BaseLayer<any>): Result;
    insertLayer(newLayer: BaseLayer<any>, index: number): Result;
    removeLayer(layerId: string): Result;
    moveChild(id: string, offset: number): void;
}