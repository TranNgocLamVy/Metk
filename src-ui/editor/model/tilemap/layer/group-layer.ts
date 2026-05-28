import { v4 as uuidv4 } from "uuid";
import { GroupLayerData, LayerData } from "@/shared/schema/layer.schema";
import { Result } from "@/shared/types/result";

import { BaseLayer, BaseLayerEvents, IGroupLayer } from "./base-layer";
import { LayerUtils } from "@/shared/utils/layer.utils";
import { BaseObject } from "../../base-object";
import { Tilemap } from "../tilemap";

interface GroupLayerEvents extends BaseLayerEvents {
    layerReordered: () => void;
    layerAdded: (layerId: string, index: number) => void;
    layerRemoved: (layerId: string, index: number) => void;
}

export class GroupLayer extends BaseLayer<GroupLayerEvents> implements IGroupLayer {
    public layers: BaseLayer[] = [];
    public isOpen: boolean = false;

    constructor(
        groupLayerData: GroupLayerData,
        parentLayer: IGroupLayer,
        tilemap: Tilemap,
        objectIdScope: string = parentLayer.objectIdScope
    ) {
        super(groupLayerData.id, tilemap, objectIdScope, "Group Layer");

        this.parentLayer = parentLayer;

        this.name = groupLayerData.name ?? "Unknow Group Layer";

        this.opacity = groupLayerData.opacity ?? 1;
        this.visible = groupLayerData.visible ?? true;
        this.locked = groupLayerData.locked ?? false;
        this.isOpen = groupLayerData.open ?? true;

        const layers = groupLayerData.layers ?? [];
        layers.forEach(layerData => {
            const layer = this.createLayerTree(layerData, this);
            if (layer) this.pushLayer(layer);
        });
    }

    private createLayerTree(layerData: LayerData, parentLayer: IGroupLayer): BaseLayer<any> | null {
        const layer = LayerUtils.createLayerFromData(layerData, parentLayer, this.tilemap, this.objectIdScope);
        return layer;
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

    public toggleOpen(force?: boolean): void {
        this.isOpen = force === undefined ? !this.isOpen : force;
        this.eventEmitter.emit("updateProperty", "isOpen", this.isOpen);
    }

    public override traverse(cb: (layer: BaseLayer<any>) => void) {
        cb(this);
        this.layers.forEach(c => c.traverse(cb));
    }

    public override serialize(): GroupLayerData {
        return {
            id: this.id,
            type: "group",
            name: this.name,
            opacity: this.opacity,
            visible: this._visible,
            locked: this._locked,
            open: this.isOpen,
            layers: this.layers.map(layer => layer.serialize())
        };
    }

    public override clone(): GroupLayer {
        const groupLayerData = this.serialize();
        groupLayerData.id = uuidv4();
        groupLayerData.layers = groupLayerData.layers!.map((layerData) => GroupLayer.cloneLayerDataWithNewIds(layerData));
        return new GroupLayer(groupLayerData, this.parentLayer, this.tilemap, this.objectIdScope);
    }

    private static cloneLayerDataWithNewIds(layerData: LayerData): LayerData {
        if (layerData.type === "group") {
            return {
                ...layerData,
                id: uuidv4(),
                layers: layerData.layers!.map((childLayerData) => GroupLayer.cloneLayerDataWithNewIds(childLayerData)),
            };
        }

        return {
            ...layerData,
            id: uuidv4(),
        };
    }

    public override removeRulesetRef(rulesetIndex: number): void {
        this.layers.forEach((layer) => layer.removeRulesetRef(rulesetIndex));
    }

    public override removeTilesetRef(tilesetIndex: number): void {
        this.layers.forEach((layer) => layer.removeTilesetRef(tilesetIndex));
    }

    public override getObjectChildren(): BaseObject<any>[] {
        return this.layers;
    }

    public override destroy(): void {
        this.layers.forEach((layer) => layer.destroy());
        super.destroy();
    }
}
