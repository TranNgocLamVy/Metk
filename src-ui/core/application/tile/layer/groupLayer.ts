import { v4 as uuidv4 } from "uuid";

import { TilesetRefManager } from "@/core/manager/tilesetRefManager";
import { GroupLayerData } from "@/shared/schema/layerSchema";
import { Result } from "@/shared/types/result";
import { LayerUtils } from "@/shared/utils/layerUtils";

import { BaseLayer, BaseLayerEvents, IGroupLayer, TilemapProps } from "./baseLayer";
import { RulesetRefManager } from "@/core/manager/rulesetRefManager";

interface GroupLayerEvents extends BaseLayerEvents {
    layerReordered: () => void;
    layerAdded: (layerId: string, index: number) => void;
    layerRemoved: (layerId: string, index: number) => void;
}

export class GroupLayer extends BaseLayer<GroupLayerEvents> implements IGroupLayer {
    public layers: BaseLayer[] = [];
    public isOpen: boolean = false;

    constructor(groupLayerData: GroupLayerData, parentLayer: IGroupLayer, tilesetRefManager: TilesetRefManager, rulesetRefManager: RulesetRefManager, tilemapProps: TilemapProps) {
        super(groupLayerData.id, tilesetRefManager, rulesetRefManager, tilemapProps);

        this.parentLayer = parentLayer;

        this.name = groupLayerData.name;

        this.opacity = groupLayerData.opacity;
        this.visible = groupLayerData.visible;
        this.locked = groupLayerData.locked;
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
    }

    public override traverse(cb: (layer: BaseLayer<any>) => void) {
        cb(this);
        this.layers.forEach(c => c.traverse(cb));
    }

    public override serialize(): GroupLayerData {
        return {
            id: this.id,
            parentId: this.parentLayer.id,
            type: "group",
            name: this.name,
            opacity: this.opacity,
            visible: this.visible,
            locked: this.locked,
        }
    }

    public override clone(): GroupLayer {
        const groupLayerData = this.serialize();
        groupLayerData.id = uuidv4();
        return new GroupLayer(groupLayerData, this.parentLayer, this.tilesetRefManager, this.rulesetRefManager, this.tilemapProps);
    }

    public override removeRulesetRef(rulesetIndex: number): void {
        this.layers.forEach((layer) => layer.removeRulesetRef(rulesetIndex));
    }

    public override removeTilesetRef(tilesetIndex: number): void {
        this.layers.forEach((layer) => layer.removeTilesetRef(tilesetIndex));
    }
}