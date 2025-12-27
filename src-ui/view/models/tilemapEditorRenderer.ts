import { Viewport } from "pixi-viewport";
// src-ui/view/models/tilemapViewRenderer.ts
import { Container, Graphics, Sprite } from "pixi.js";

import { TileLayer } from "@/core/application/tile/layer/tileLayer";
import { Tilemap } from "@/core/application/tile/tilemap";
import { Tile, Tileset } from "@/core/application/tile/tileset";

export class TilemapRenderer {
    private tilemap: Tilemap;
    private parent: Viewport;
    private container: Container;
    private gridGraphics: Graphics;
    private isGridVisible: boolean = true;

    constructor(props: { tilemap: Tilemap; parent: Viewport }) {
        this.tilemap = props.tilemap;
        this.parent = props.parent;

        this.container = new Container();
        this.gridGraphics = new Graphics();
        this.gridGraphics.zIndex = 999;

        this.parent.addChild(this.container);
        this.parent.addChild(this.gridGraphics);

        this.renderInitial();
    }

    public renderInitial() {
        this.container.removeChildren();

        this.initRenderer(this.container);

        this.updateGrid();
    }


    public async initRenderer(container: Container) {
        for (const tilelayer of this.tilemap.rootLayer.getLayers()) {
            if (tilelayer instanceof TileLayer) {

                const layerContainer = new Container();
                container.addChild(layerContainer);

                const tilesetMap = new Map<string, Tileset>();

                const size = tilelayer.size;
                // for (let y = 0; y < size.height; y++) {
                //     for (let x = 0; x < size.width; x++) {
                //         const tileResult = tilelayer.getTileRefAt({ x, y });
                //         if (!tileResult.data) continue;

                //         const tileRef = tileResult.data;
                //         const tileData = tileRef.getTile();

                //         const tilesetId = this.tilemap.tilesets.find(tileset => tileset.index === tileData.tilesetIndex)?.id;
                //         if (!tilesetId) continue;

                //         let tile: Tile | null;
                //         if (tilesetMap.has(tilesetId)) {
                //             const tileset = tilesetMap.get(tilesetId)!;
                //             tile = tileset.getTile(tileData.tileId);
                //         } else {
                //             const tilesetResult = this.tilemap.tilesetGetter.getTilesetById(tilesetId);
                //             const tileset = tilesetResult.data;
                //             if (!tileset) return;
                //             tilesetMap.set(tileset.id, tileset);
                //             tile = tileset.getTile(tileData.tileId);
                //         }
                //         if (!tile) continue;

                //         const sprite = new Sprite(tile.getTexture());
                //         sprite.x = x * this.tilemap.tilewidth;
                //         sprite.y = y * this.tilemap.tileheight;
                //         layerContainer.addChild(sprite);
                //     }
                // }
            }
        }
    }

    public updateGrid() {
        if (!this.isGridVisible) {
            this.gridGraphics.clear();
            return;
        }

        this.gridGraphics.clear();
        this.gridGraphics.setStrokeStyle({ width: 1, color: 0x333333, alpha: 0.5 })

        const tileWidth = this.tilemap.tilewidth;
        const tileHeight = this.tilemap.tileheight;

        // Tính toán vùng nhìn thấy (Visible Bounds)
        const bounds = this.parent.getVisibleBounds();

        // Làm tròn bounds để khớp với lưới tile
        const startX = Math.floor(bounds.x / tileWidth) * tileWidth;
        const endX = Math.ceil((bounds.x + bounds.width) / tileWidth) * tileWidth;
        const startY = Math.floor(bounds.y / tileHeight) * tileHeight;
        const endY = Math.ceil((bounds.y + bounds.height) / tileHeight) * tileHeight;

        // Vẽ đường dọc
        for (let x = startX; x <= endX; x += tileWidth) {
            this.gridGraphics.moveTo(x, startY);
            this.gridGraphics.lineTo(x, endY);
        }

        // Vẽ đường ngang
        for (let y = startY; y <= endY; y += tileHeight) {
            this.gridGraphics.moveTo(startX, y);
            this.gridGraphics.lineTo(endX, y);
        }
    }

    public toggleGrid(visible?: boolean) {
        this.isGridVisible = visible ?? !this.isGridVisible;
        this.updateGrid();
    }

    public destroy() {
        this.container.destroy({ children: true });
        this.gridGraphics.destroy();
    }
}