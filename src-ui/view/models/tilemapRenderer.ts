import { Container } from "pixi.js";

import { Tilemap } from "@/core/application/tile/tilemap";

import { GroupLayerRenderer } from "./renderer/groupLayerRenderer";

type CreateTilemapRendererContext = {
    tilemap: Tilemap
    gap: number
}

export class TilemapRenderer {
    public container: Container;
    public rootRenderer: GroupLayerRenderer;
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