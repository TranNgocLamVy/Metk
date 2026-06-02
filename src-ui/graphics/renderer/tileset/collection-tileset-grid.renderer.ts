import { Viewport } from "pixi-viewport";
import { Graphics } from "pixi.js";

import { Tile, Tileset } from "@/editor/model/tileset/tileset";
import { DrawLineOption, GraphicUtils } from "@/shared/utils/graphic-utils";

export type CollectionTileLayout = {
    tile: Tile;
    index: number;

    cellX: number;
    cellY: number;
    cellSize: number;

    x: number;
    y: number;
    width: number;
    height: number;
};

type CreateCollectionTilesetGridRendererContext = {
    viewport: Viewport;
    tileset: Tileset;
};

export class CollectionTilesetGridRenderer {
    public readonly graphics: Graphics;
    public gridEnabled: boolean = true;

    private viewport: Viewport;
    private tileset: Tileset;
    private layouts: CollectionTileLayout[] = [];

    private bindOnTilesetUpdate: () => void;

    constructor(context: CreateCollectionTilesetGridRendererContext) {
        this.viewport = context.viewport;
        this.tileset = context.tileset;

        this.graphics = new Graphics();

        this.bindOnTilesetUpdate = this.rerenderGrid.bind(this);
        this.tileset.eventEmitter.on("update", this.bindOnTilesetUpdate);

        this.rerenderGrid();
    }

    public getLayouts(): CollectionTileLayout[] {
        return this.layouts;
    }

    public getLayoutAtPosition(position: { x: number; y: number }): CollectionTileLayout | null {
        return (
            this.layouts.find((layout) => {
                return (
                    position.x >= layout.cellX &&
                    position.y >= layout.cellY &&
                    position.x <= layout.cellX + layout.cellSize &&
                    position.y <= layout.cellY + layout.cellSize
                );
            }) ?? null
        );
    }

    public rerenderGrid(): void {
        this.layouts = this.calculateLayouts();

        this.graphics.clear();

        if (!this.gridEnabled) return;

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

    private drawGrid(): void {
        const columns = this.getColumns();
        const rows = this.getRows();
        const cellSize = this.getCellSize();

        if (columns <= 0 || rows <= 0) return;

        const drawLineOptions: DrawLineOption = {
            color: 0xc9c9c9,
            alpha: 0.5,
            pixelLine: true,
        };

        for (let col = 0; col <= columns; col++) {
            GraphicUtils.drawVerticelLine(
                this.graphics,
                col * cellSize,
                0,
                rows * cellSize,
                drawLineOptions,
            );
        }

        for (let row = 0; row <= rows; row++) {
            GraphicUtils.drawHorizontalLine(
                this.graphics,
                row * cellSize,
                0,
                columns * cellSize,
                drawLineOptions,
            );
        }
    }

    private calculateLayouts(): CollectionTileLayout[] {
        const columns = this.getColumns();
        const cellSize = this.getCellSize();

        if (columns <= 0 || this.tileset.tiles.length === 0) return [];

        return this.tileset.tiles.map((tile, index) => {
            const { width: naturalWidth, height: naturalHeight } =
                this.getTileNaturalSize(tile);

            const scale = Math.min(
                cellSize / naturalWidth,
                cellSize / naturalHeight,
            );

            const width = Math.max(1, naturalWidth * scale);
            const height = Math.max(1, naturalHeight * scale);

            const col = index % columns;
            const row = Math.floor(index / columns);

            const cellX = col * cellSize;
            const cellY = row * cellSize;

            return {
                tile,
                index,

                cellX,
                cellY,
                cellSize,

                x: cellX + (cellSize - width) / 2,
                y: cellY + (cellSize - height) / 2,
                width,
                height,
            };
        });
    }

    private getRows(): number {
        const columns = this.getColumns();

        if (columns <= 0) return 0;

        return Math.ceil(this.tileset.tiles.length / columns);
    }

    private getColumns(): number {
        if (this.tileset.columns > 0) {
            return this.tileset.columns;
        }

        return Math.max(1, Math.ceil(Math.sqrt(this.tileset.tiles.length || 1)));
    }

    private getCellSize(): number {
        const fallbackWidth = Math.max(1, this.tileset.tileWidth || 1);
        const fallbackHeight = Math.max(1, this.tileset.tileHeight || 1);

        const maxTileSide = this.tileset.tiles.reduce((max, tile) => {
            const { width, height } = this.getTileNaturalSize(tile);
            return Math.max(max, width, height);
        }, Math.max(fallbackWidth, fallbackHeight));

        return Math.max(1, maxTileSide);
    }

    private getTileNaturalSize(tile: Tile): { width: number; height: number } {
        return {
            width: Math.max(
                1,
                tile.imageSource?.width ?? this.tileset.tileWidth ?? 1,
            ),
            height: Math.max(
                1,
                tile.imageSource?.height ?? this.tileset.tileHeight ?? 1,
            ),
        };
    }

    public destroy(): void {
        this.tileset.eventEmitter.off("update", this.bindOnTilesetUpdate);
        this.graphics.destroy();
    }
}