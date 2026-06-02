import { Container, Graphics } from "pixi.js";

import { Tilemap } from "@/editor/model/tilemap/tilemap";

import { Viewport } from "pixi-viewport";
import { BaseLayerRenderer } from "./base-layer.renderer";
import { GroupLayerRenderer } from "./group-layer.renderer";

type CreateTilemapRendererContext = {
    tilemap: Tilemap
    viewport: Viewport;
}

export class TilemapRenderer {
    public container: Container;
    public rootRenderer: GroupLayerRenderer;
    private borderGraphic: Graphics;
    public tilemap: Tilemap

    constructor(createContext: CreateTilemapRendererContext) {
        this.tilemap = createContext.tilemap;

        this.container = new Container({ isRenderGroup: true });
        this.container.label = "Tilemap-Root";

        // Pass tilemap to the root group renderer
        this.rootRenderer = new GroupLayerRenderer({ layer: this.tilemap.rootLayer, tilemap: this.tilemap, viewport: createContext.viewport });
        this.container.addChild(this.rootRenderer.container);

        this.borderGraphic = new Graphics();
        this.container.addChild(this.borderGraphic);
        this.renderBorder();
    }

    public findLayerRenderer(layerId: string): BaseLayerRenderer | null {
        return this.rootRenderer.findChildRenderer(layerId);
    }

    private renderBorder(): void {
        this.borderGraphic.clear();

        const { width, height } = this.tilemap;
        const { tileWidth , tileHeight } = this.tilemap;

        const minX = 0, maxX = width * tileWidth, minY = 0, maxY = height * tileHeight;

        this.borderGraphic.moveTo(minX, minY).lineTo(maxX, minY).lineTo(maxX, maxY).lineTo(minX, maxY).lineTo(minX, minY);

        this.borderGraphic.stroke({ color: 0xffffff, pixelLine: true });
    }

    public destroy(): void {
        this.rootRenderer.destroy();
        this.container.destroy({ children: true, texture: false });
    }
}