import { Container } from "pixi.js";

import { BaseLayer } from "@/editor/model/tilemap/layer/base-layer";
import { Tilemap } from "@/editor/model/tilemap/tilemap";

export type LayerPropertyUpdate = {
    key?: string;
    value?: unknown;
};

export abstract class BaseLayerRenderer<T extends BaseLayer<any> = BaseLayer<any>> {
    public container: Container;
    public layer: T;
    public tilemap: Tilemap;

    private bindOnPropertyUpdate: (...args: unknown[]) => void

    constructor(layer: T, tilemap: Tilemap) {
        this.layer = layer;
        this.tilemap = tilemap;
        this.container = new Container();
        this.container.label = layer.name;
        
        // Initial properties
        this.updateProperties();

        this.bindOnPropertyUpdate = (...args: unknown[]) => {
            this.handleLayerPropertyChanged(normalizeLayerPropertyUpdate(args));
        };

        // Listen for property changes
        (this.layer.eventEmitter as any).on("updateProperty", this.bindOnPropertyUpdate);
    }

    protected handleLayerPropertyChanged(update: LayerPropertyUpdate): void {
        this.updateProperties(update);
    }

    protected updateProperties(_update?: LayerPropertyUpdate): void {
        this.container.label = this.layer.name;
        this.container.visible = this.layer.visible;
        this.container.alpha = this.layer.opacity;
    }

    public posToCoord(pos: Point2D): Coordinate {
        throw new Error("Method not implemented.");
    }

    public coordToPos(coord: Coordinate): Point2D {
        throw new Error("Method not implemented.");
    }

    public destroy(): void {
        (this.layer.eventEmitter as any).off("updateProperty", this.bindOnPropertyUpdate);
        this.container.destroy({ children: true, texture: false });
    }
}

function normalizeLayerPropertyUpdate(args: unknown[]): LayerPropertyUpdate {
    const [first, second] = args;

    if (
        first
        && typeof first === "object"
        && "key" in first
    ) {
        const update = first as { key?: unknown; value?: unknown };

        return {
            key: typeof update.key === "string" ? update.key : undefined,
            value: update.value,
        };
    }

    return {
        key: typeof first === "string" ? first : undefined,
        value: second,
    };
}
