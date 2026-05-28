import { TilesetRefManager } from "@/application/resources/references/tileset-ref.manager";
import { Result } from "@/shared/types/result";

import { BaseObject, BaseObjectEvents } from "../../base-object";
import { RulesetRefManager } from "@/application/resources/references/ruleset-ref.manager";
import { BooleanProperty, NumberProperty, StringProperty } from "@/editor/properties/properties.decorator";
import { Tilemap } from "../tilemap";

export interface BaseLayerEvents extends BaseObjectEvents {
    
}

export class BaseLayer<T extends BaseLayerEvents = BaseLayerEvents> extends BaseObject<T> {
    @StringProperty<BaseLayer>({
        label: "ID",
        readonly: true,
        get: (target) => target.id,
    })
    public readonly id: string;

    @StringProperty<BaseLayer>({
        label: "Layer name",
        get: (target) => target.name,
        set: (target, value) => { target.rename(value) },
    })
    public name: string;

    @NumberProperty<BaseLayer>({
        label: "Opacity",
        group: "Properties",
        order: 1,
        slider: {
            range: [0, 1],
            step: 0.01,
        },
        get: (target) => target.opacity,
        set: (target, value) => { target.updateOpacity(value) },
    })
    public opacity: number = 1;

    @BooleanProperty<BaseLayer>({
        label: "Visible",
        group: "Properties",
        order: 2,
        get: (target) => target._visible,
        set: (target, value) => { target.toggleVisibility(value) },
    })
    protected _visible: boolean = true;

    @BooleanProperty<BaseLayer>({
        label: "Locked",
        group: "Properties",
        order: 3,
        get: (target) => target._locked,
        set: (target, value) => { target.toggleLock(value) },
    })
    protected _locked: boolean = false;

    @StringProperty<BaseLayer>({
        label: "Layer Type",
        readonly: true,
        get: (target) => target.layerType,
    })
    public readonly layerType: string = "Unknow";

    public get visible() { return this._visible && this.parentLayer ? this.parentLayer.visible : this._visible }
    public set visible(value: boolean) {
        this._visible = value;
        (this.eventEmitter as any).emit("updateProperty", "visible", this._visible);
    }

    public get locked() { return this._locked || (this.parentLayer ? this.parentLayer.locked : false) }
    public set locked(value: boolean) {
        this._locked = value;
        (this.eventEmitter as any).emit("updateProperty", "locked", this._locked);
    }

    public parentLayer: IGroupLayer;

    public get tilesetRefManager() {
        return this.tilemap.tilesetRefManager;
    }

    public get rulesetRefManager() {
        return this.tilemap.rulesetRefManager;
    }

    constructor(
        id: string, 
        public readonly tilemap: Tilemap,
        public readonly objectIdScope: string = "object",
        layerType: string = "Unknow"
    ) {
        super(`${objectIdScope}:layer:${id}`);
        this.id = id;
        this.layerType = layerType;
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

    public duplicate(): BaseLayer<any> | null {
        if (!this.parentLayer) return null;

        const index = this.parentLayer.getLayerIndex(this.id);
        if (index == -1) return null

        const clone = this.clone();

        this.parentLayer.insertLayer(clone, index + 1);
        return clone;
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

    public removeRulesetRef(rulesetIndex: number): void {
        // pass
    }

    public removeTilesetRef(tilesetIndex: number): void {
        // pass
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
    objectId: string;
    objectIdScope: string;
    parentLayer: IGroupLayer | null;
    tilesetRefManager: TilesetRefManager;
    rulesetRefManager: RulesetRefManager;
    layers: BaseLayer<any>[];
    visible: boolean;
    locked: boolean;
    getLayerIndex(layerId: string): number;
    addLayer(newLayer: BaseLayer<any>): Result;
    pushLayer(newLayer: BaseLayer<any>): Result;
    insertLayer(newLayer: BaseLayer<any>, index: number): Result;
    removeLayer(layerId: string): Result;
    moveChild(id: string, offset: number): void;
}
