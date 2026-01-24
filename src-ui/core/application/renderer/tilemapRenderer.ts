import { Container, Graphics } from "pixi.js";

import { Tilemap } from "@/core/application/tile/tilemap";

import { GroupLayerRenderer } from "./groupLayerRenderer";

type CreateTilemapRendererContext = {
    tilemap: Tilemap
    gap: number
}

export class TilemapRenderer {
    public container: Container;
    public rootRenderer: GroupLayerRenderer;
    private borderGraphic: Graphics;
    public tilemap: Tilemap
    private gap: number;

    constructor(context: CreateTilemapRendererContext) {
        this.tilemap = context.tilemap;
        this.gap = context.gap;

        this.container = new Container({ isRenderGroup: true });
        this.container.label = "Tilemap-Root";

        // Pass tilemap to the root group renderer
        this.rootRenderer = new GroupLayerRenderer({ layer: this.tilemap.rootLayer, tilemap: this.tilemap, gap: this.gap });
        this.container.addChild(this.rootRenderer.container);

        this.borderGraphic = new Graphics();
        this.container.addChild(this.borderGraphic);
        this.renderBorder();
    }

    private renderBorder(): void {
        this.borderGraphic.clear();

        const { width, height } = this.tilemap;
        const { tilewidth , tileheight } = this.tilemap;

        const minX = 0, maxX = width * tilewidth, minY = 0, maxY = height * tileheight;

        this.borderGraphic.moveTo(minX, minY).lineTo(maxX, minY).lineTo(maxX, maxY).lineTo(minX, maxY).lineTo(minX, minY);

        this.borderGraphic.stroke({ color: 0xffffff, pixelLine: true });
    }

    public setGap(gap: number): void {
        this.gap = gap;
        this.rootRenderer.setGap(gap);
    }

    public destroy(): void {
        this.rootRenderer.destroy();
        this.container.destroy({ children: true, texture: false });
    }
}