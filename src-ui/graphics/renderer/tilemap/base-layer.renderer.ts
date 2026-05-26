import { Container } from "pixi.js";

import { BaseLayer, BaseLayerEvents } from "@/editor/model/tilemap/layer/base-layer";
import { Tilemap } from "@/editor/model/tilemap/tilemap";

export abstract class BaseLayerRenderer<T extends BaseLayer<any> = BaseLayer<any>> {
    public container: Container;
    public layer: T;
    public tilemap: Tilemap;

    private bindOnPropertyUpdate: (property: keyof BaseLayerEvents, value: any) => void

    constructor(layer: T, tilemap: Tilemap) {
        this.layer = layer;
        this.tilemap = tilemap;
        this.container = new Container();
        this.container.label = layer.name;
        
        // Initial properties
        this.updateProperties();

        this.bindOnPropertyUpdate = this.updateProperties.bind(this);

        // Listen for property changes
        (this.layer.eventEmitter as any).on("updateProperty", this.bindOnPropertyUpdate);
    }

    protected updateProperties(): void {
        this.container.visible = this.layer.visible;
        this.container.alpha = this.layer.opacity;
    }

    public posToCoord(pos: Position): Coordinate {
        throw new Error("Method not implemented.");
    }

    public coordToPos(coord: Coordinate): Position {
        throw new Error("Method not implemented.");
    }

    public destroy(): void {
        (this.layer.eventEmitter as any).off("updateProperty", this.bindOnPropertyUpdate);
        this.container.destroy({ children: true, texture: false });
    }
}