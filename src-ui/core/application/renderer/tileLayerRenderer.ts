import { Sprite } from "pixi.js";

import { SetTilesData, TileLayer } from "@/core/application/tile/layer/tileLayer";
import { Tilemap } from "@/core/application/tile/tilemap";

import { BaseLayerRenderer } from "./baseLayerRenderer";
import { AppCore } from "@/core/appcore";

type CreateTileLayerRendererContext = {
    layer: TileLayer;
    tilemap: Tilemap;
    gap: number;
}

export class TileLayerRenderer extends BaseLayerRenderer<TileLayer> {
    private sprites: Map<string, Sprite> = new Map(); // key: `${col},${row}` -> Sprite

    private bindOnTilesChanged: (coords: Coordinate[]) => void

    constructor(context: CreateTileLayerRendererContext) {
        super(context.layer, context.tilemap);
        this.gap = context.gap;

        this.bindOnTilesChanged = this.onTilesChanged.bind(this);

        // Initial render
        this.renderLayer();
        this.layer.eventEmitter.on("tilesChanged", this.bindOnTilesChanged);
    }

    private renderLayer(): void {
        const { width, height } = this.layer.size;
        for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
                this.renderTile(col, row);
            }
        }
    }

    private onTilesChanged(coordinates: Coordinate[]) {
        for (const coordinate of coordinates) {
            this.renderTile(coordinate.col, coordinate.row);
        }
    }

    private async renderTile(col: number, row: number): Promise<void> {
        const tileRef = this.layer.getTileRefAt({ col: col, row: row });
        const key = `${col},${row}`;
        const currentSprite = this.sprites.get(key);
        if (!tileRef) {
            if (currentSprite) {
                currentSprite.destroy();
                this.sprites.delete(key);
            }
            return;
        }

        // TODO: Fix: Get textureManager from passing context
        const textureManager = AppCore.getIns().editorContext.textureManager;
        const texture = textureManager.getTileTexture(tileRef.tilesetId, tileRef.tileId);

        // TODO: Handle unfound tileset, render error texture
        if (!texture) return;

        // Calculate Position: (GridPos + LayerGridOffset) * (TileSize + Gap) + LayerPixelOffset
        const posX = (col + this.layer.coordinate.col) * (this.tilemap.tilewidth + this.gap) + this.layer.offset.x;
        const posY = (row + this.layer.coordinate.row) * (this.tilemap.tileheight + this.gap) + this.layer.offset.y;

        if (currentSprite) {
            currentSprite.texture = texture;
            currentSprite.x = posX;
            currentSprite.y = posY;
        } else {
            const sprite = new Sprite(texture);
            sprite.x = posX;
            sprite.y = posY;

            this.container.addChild(sprite);
            this.sprites.set(key, sprite);
        }
    }

    public override setGap(gap: number): void {
        super.setGap(gap);
        this.renderLayer();
    }

    public override destroy(): void {
        this.layer.eventEmitter.off("tilesChanged", this.bindOnTilesChanged);
        super.destroy();
        this.sprites.clear();
    }
}