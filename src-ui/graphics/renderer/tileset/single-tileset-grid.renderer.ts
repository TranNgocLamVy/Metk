import { Viewport } from "pixi-viewport";
import { Graphics } from "pixi.js";

import { Tileset } from "@/editor/model/tileset/tileset";
import { DrawLineOption, GraphicUtils } from "@/shared/utils/graphic-utils";

type CreateGridRendererContext = {
    viewport: Viewport;
    tileset: Tileset;
}

export class TilesetGridRenderer {
    public readonly graphics: Graphics;
    private viewport: Viewport;
    private tileset: Tileset;
    public gridEnabled: boolean = true;

    private bindOnTilesetUpdate: () => void;

    constructor(editorFacade: CreateGridRendererContext) {
        this.viewport = editorFacade.viewport;
        this.tileset = editorFacade.tileset;
        
        this.graphics = new Graphics();

        this.bindOnTilesetUpdate = this.drawGrid.bind(this);

        this.tileset.eventEmitter.on("update", this.bindOnTilesetUpdate);

        this.drawGrid();
    }

    private drawGrid(): void {
        const tileWidth = this.tileset.tileWidth;
        const tileHeight = this.tileset.tileHeight;

        const columns = this.tileset.columns;
        const rows = Math.ceil(this.tileset.tiles.length / columns);

        const drawLineOptions: DrawLineOption = { color: 0xc9c9c9, alpha: 0.5, pixelLine: true }

        for (let col = 0; col <= columns; col++) {
            GraphicUtils.drawVerticelLine(this.graphics, col * (tileWidth), 0, rows * (tileHeight), drawLineOptions);
        }

        for (let row = 0; row <= rows; row++) {
            GraphicUtils.drawHorizontalLine(this.graphics, row * (tileHeight), 0, columns * (tileWidth), drawLineOptions);
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