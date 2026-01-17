import { Container } from "pixi.js";

import { BaseLayer, BaseLayerEvents } from "@/core/application/tile/layer/baseLayer";
import { Tilemap } from "@/core/application/tile/tilemap";

export abstract class BaseLayerRenderer<T extends BaseLayer<any> = BaseLayer<any>> {
    public container: Container;
    public layer: T;
    public tilemap: Tilemap;
    protected gap: number;

    constructor(layer: T, tilemap: Tilemap) {
        this.layer = layer;
        this.tilemap = tilemap;
        this.container = new Container();
        this.container.label = layer.name;
        
        // Initial properties
        this.updateProperties();

        // Listen for property changes
        (this.layer.eventEmitter as any).on("updateProperty", this.onPropertyUpdate);
    }

    private onPropertyUpdate = (property: keyof BaseLayerEvents, value: any) => {
        this.updateProperties();
    };

    protected updateProperties(): void {
        this.container.visible = this.layer.visible;
        this.container.alpha = this.layer.opacity;
    }


    public setGap(gap: number): void {
        this.gap = gap;
    }

    public destroy(): void {
        (this.layer.eventEmitter as any).off("updateProperty", this.onPropertyUpdate);
        this.container.destroy({ children: true, texture: false });
    }
}