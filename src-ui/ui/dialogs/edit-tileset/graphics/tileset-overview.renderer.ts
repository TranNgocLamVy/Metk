import {
    Application,
    Container,
    FederatedPointerEvent,
    Graphics,
    Rectangle,
    Sprite,
    Texture,
} from "pixi.js";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { Tile, Tileset } from "@/editor/model/tileset/tileset";
import { GraphicUtils } from "@/shared/utils/graphic-utils";

type TilesetOverviewRenderOptions = {
    pixiApp: Application;
    tileset: Tileset;
    selectedTileId: number | null;
    width: number;
    height: number;
    onSelectTile: (tileId: number | null) => void;
};

type TileLayout = {
    tile: Tile;

    cellX: number;
    cellY: number;
    cellWidth: number;
    cellHeight: number;

    x: number;
    y: number;
    width: number;
    height: number;
};

type TilesetLayoutInfo = {
    layouts: TileLayout[];
    width: number;
    height: number;
    columns: number;
    rows: number;
    cellWidth: number;
    cellHeight: number;
};

export function renderTilesetOverview(options: TilesetOverviewRenderOptions) {
    const renderer = new TilesetOverviewPixiRenderer(options);
    renderer.render();

    return () => renderer.destroy();
}

class TilesetOverviewPixiRenderer {
    private disposed = false;
    private root: Container | null = null;
    private layoutInfo: TilesetLayoutInfo | null = null;

    constructor(private readonly options: TilesetOverviewRenderOptions) {}

    public render() {
        const { pixiApp, width, height } = this.options;
        const stage = pixiApp.stage;

        stage.removeChildren();
        stage.eventMode = "static";
        stage.hitArea = new Rectangle(0, 0, width, height);

        this.layoutInfo = getTilesetLayoutInfo(this.options.tileset);

        if (this.layoutInfo.width <= 0 || this.layoutInfo.height <= 0) return;

        this.root = this.createRoot(this.layoutInfo);
        stage.addChild(this.root);
        stage.on("pointerdown", this.handlePointerDown);

        void this.renderTileset(this.root, this.layoutInfo);
    }

    public destroy() {
        this.disposed = true;

        const stage = this.options.pixiApp.stage;
        stage.off("pointerdown", this.handlePointerDown);
        stage.removeChildren();
        this.root?.destroy({ children: true });
    }

    private createRoot(layoutInfo: TilesetLayoutInfo) {
        const root = new Container();
        const padding = 16;
        const { width, height } = this.options;

        const scale = Math.max(
            0.01,
            Math.min(
                (width - padding * 2) / layoutInfo.width,
                (height - padding * 2) / layoutInfo.height,
            ),
        );

        root.scale.set(scale);
        root.position.set(
            (width - layoutInfo.width * scale) / 2,
            (height - layoutInfo.height * scale) / 2,
        );

        return root;
    }

    private async renderTileset(root: Container, layoutInfo: TilesetLayoutInfo) {
        const textureManager = appKernel.editorFacade.textureManager;
        let errorTexture: Texture | null = null;

        for (const layout of layoutInfo.layouts) {
            let texture = textureManager.getTileTexture(
                this.options.tileset.id,
                layout.tile.id,
            );

            if (!texture) {
                if (!errorTexture) {
                    errorTexture = await textureManager.getErrorTexture();
                }

                texture = errorTexture;
            }

            if (this.disposed) return;

            root.addChild(makeTileSprite(layout, texture));
        }

        root.addChild(makeGridGraphics(layoutInfo));

        const selectedLayout = layoutInfo.layouts.find(
            (layout) => layout.tile.id === this.options.selectedTileId,
        );

        if (selectedLayout) {
            root.addChild(makeSelectionGraphics(selectedLayout));
        }
    }

    private handlePointerDown = (event: FederatedPointerEvent) => {
        if (!this.root || !this.layoutInfo) return;

        const local = this.root.toLocal(event.global);
        const layout = this.layoutInfo.layouts.find((item) => {
            return (
                local.x >= item.cellX &&
                local.y >= item.cellY &&
                local.x <= item.cellX + item.cellWidth &&
                local.y <= item.cellY + item.cellHeight
            );
        });

        this.options.onSelectTile(layout?.tile.id ?? null);
    };
}

function makeTileSprite(layout: TileLayout, texture: Texture) {
    const sprite = new Sprite(texture);

    sprite.position.set(layout.x, layout.y);
    sprite.width = layout.width;
    sprite.height = layout.height;

    return sprite;
}

function makeSelectionGraphics(layout: TileLayout) {
    const selection = new Graphics();

    selection.fill({
        color: 0x0090f1,
        alpha: 0.4,
    });

    selection.rect(
        layout.cellX,
        layout.cellY,
        layout.cellWidth,
        layout.cellHeight,
    );

    selection.fill();

    return selection;
}

function getTilesetLayoutInfo(tileset: Tileset): TilesetLayoutInfo {
    if (tileset.isImageCollection()) {
        return getCollectionTilesetLayoutInfo(tileset);
    }

    return getSingleImageTilesetLayoutInfo(tileset);
}

function getSingleImageTilesetLayoutInfo(tileset: Tileset): TilesetLayoutInfo {
    const columns = Math.max(1, tileset.columns);
    const rows = Math.max(
        1,
        tileset.rows || Math.ceil(tileset.tiles.length / columns),
    );

    const cellWidth = Math.max(1, tileset.tilewidth);
    const cellHeight = Math.max(1, tileset.tileheight);

    const layouts = tileset.tiles.map((tile, index) => {
        const col = index % columns;
        const row = Math.floor(index / columns);

        const cellX = col * cellWidth;
        const cellY = row * cellHeight;

        return {
            tile,

            cellX,
            cellY,
            cellWidth,
            cellHeight,

            x: cellX,
            y: cellY,
            width: cellWidth,
            height: cellHeight,
        };
    });

    return {
        layouts,
        width: columns * cellWidth,
        height: rows * cellHeight,
        columns,
        rows,
        cellWidth,
        cellHeight,
    };
}

function getCollectionTilesetLayoutInfo(tileset: Tileset): TilesetLayoutInfo {
    const columns =
        tileset.columns > 0
            ? tileset.columns
            : Math.max(1, Math.ceil(Math.sqrt(tileset.tiles.length || 1)));

    const rows = Math.max(1, Math.ceil(tileset.tiles.length / columns));
    const cellSize = getCollectionCellSize(tileset);

    const layouts = tileset.tiles.map((tile, index) => {
        const naturalSize = getTileNaturalSize(tileset, tile);

        const scale = Math.min(
            cellSize / naturalSize.width,
            cellSize / naturalSize.height,
        );

        const width = Math.max(1, naturalSize.width * scale);
        const height = Math.max(1, naturalSize.height * scale);

        const col = index % columns;
        const row = Math.floor(index / columns);

        const cellX = col * cellSize;
        const cellY = row * cellSize;

        return {
            tile,

            cellX,
            cellY,
            cellWidth: cellSize,
            cellHeight: cellSize,

            x: cellX + (cellSize - width) / 2,
            y: cellY + (cellSize - height) / 2,
            width,
            height,
        };
    });

    return {
        layouts,
        width: columns * cellSize,
        height: rows * cellSize,
        columns,
        rows,
        cellWidth: cellSize,
        cellHeight: cellSize,
    };
}

function getCollectionCellSize(tileset: Tileset): number {
    return Math.max(
        1,
        tileset.tilewidth || 1,
        tileset.tileheight || 1,
        ...tileset.tiles.map((tile) => {
            const size = getTileNaturalSize(tileset, tile);
            return Math.max(size.width, size.height);
        }),
    );
}

function getTileNaturalSize(
    tileset: Tileset,
    tile: Tile,
): {
    width: number;
    height: number;
} {
    return {
        width: Math.max(1, tile.imageSource?.width ?? tileset.tilewidth ?? 1),
        height: Math.max(1, tile.imageSource?.height ?? tileset.tileheight ?? 1),
    };
}

function makeGridGraphics(layoutInfo: TilesetLayoutInfo): Graphics {
    const graphics = new Graphics();

    const lineOptions = {
        color: 0xc9c9c9,
        alpha: 0.5,
        pixelLine: true,
    };

    for (let col = 0; col <= layoutInfo.columns; col++) {
        GraphicUtils.drawVerticelLine(
            graphics,
            col * layoutInfo.cellWidth,
            0,
            layoutInfo.height,
            lineOptions,
        );
    }

    for (let row = 0; row <= layoutInfo.rows; row++) {
        GraphicUtils.drawHorizontalLine(
            graphics,
            row * layoutInfo.cellHeight,
            0,
            layoutInfo.width,
            lineOptions,
        );
    }

    return graphics;
}
