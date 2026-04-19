import { Sprite } from "pixi.js";

import { TileLayer } from "@/core/application/tile/layer/tileLayer";
import { Tilemap } from "@/core/application/tile/tilemap";

import { BaseLayerRenderer } from "./baseLayerRenderer";
import { AppCore } from "@/core/appcore";

type CreateTileLayerRendererContext = {
    layer: TileLayer;
    tilemap: Tilemap;
}

export class TileLayerRenderer extends BaseLayerRenderer<TileLayer> {
    private sprites: Map<string, Sprite> = new Map(); // key: `${col},${row}` -> Sprite

    private bindOnTilesChanged: (coords: Coordinate[]) => void

    constructor(context: CreateTileLayerRendererContext) {
        super(context.layer, context.tilemap);

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

        const coord = { col: col + this.layer.coordinate.col, row: row + this.layer.coordinate.row };
        const drawPotision = this.layer.coordToPos(coord);

        if (currentSprite) {
            currentSprite.texture = texture;
            currentSprite.x = drawPotision.x;
            currentSprite.y = drawPotision.y;
        } else {
            const sprite = new Sprite(texture);
            sprite.x = drawPotision.x;
            sprite.y = drawPotision.y;

            this.container.addChild(sprite);
            this.sprites.set(key, sprite);
        }
    }

    public override destroy(): void {
        this.layer.eventEmitter.off("tilesChanged", this.bindOnTilesChanged);
        super.destroy();
        
        this.sprites.forEach(s => s.destroy());
        this.sprites.clear();
    }
}