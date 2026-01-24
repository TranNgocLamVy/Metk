import { Viewport } from "pixi-viewport";
import { Graphics } from "pixi.js";

import { Tileset } from "@/core/application/tile/tileset";
import { DrawLineOption, GraphicUtils } from "@/shared/utils/graphicUtils";

type CreateGridRendererContext = {
    viewport: Viewport;
    tileset: Tileset;
}

export class TilesetGridRenderer {
    public readonly graphics: Graphics;
    private viewport: Viewport;
    private tileset: Tileset;
    public gridGap: number = 0;
    public gridEnabled: boolean = true;

    private bindOnTilesetUpdate: () => void;

    constructor(context: CreateGridRendererContext) {
        this.viewport = context.viewport;
        this.tileset = context.tileset;
        
        this.graphics = new Graphics();

        this.bindOnTilesetUpdate = this.drawGrid.bind(this);

        this.tileset.eventEmitter.on("update", this.bindOnTilesetUpdate);

        this.drawGrid();
    }

    private drawGrid(): void {
        const tileWidth = this.tileset.tilewidth;
        const tileHeight = this.tileset.tileheight;

        const columns = this.tileset.columns;
        const rows = Math.ceil(this.tileset.tiles.length / columns);

        const drawLineOptions: DrawLineOption = { color: 0xc9c9c9, alpha: 0.5, pixelLine: true }

        for (let col = 0; col <= columns; col++) {
            GraphicUtils.drawVerticelLine(this.graphics, col * (tileWidth + this.gridGap), 0, rows * (tileHeight + this.gridGap), drawLineOptions);
        }

        for (let row = 0; row <= rows; row++) {
            GraphicUtils.drawHorizontalLine(this.graphics, row * (tileHeight + this.gridGap), 0, columns * (tileWidth + this.gridGap), drawLineOptions);
        }
    }

    public rerenderGrid(): void {
        if (!this.gridEnabled) return;
        this.graphics.clear();
        this.drawGrid();
    }

    public disableGrid(): void {
        this.gridEnabled = false;
        this.graphics.clear();
    }

    public enableGrid(): void {
        this.gridEnabled = true;
        this.rerenderGrid();
    }

    public destroy(): void {
        this.tileset.eventEmitter.off("update", this.bindOnTilesetUpdate);
    }
}