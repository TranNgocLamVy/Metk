import { Sprite } from "pixi.js";

import { TileLayer } from "@/core/application/tile/layer/tileLayer";
import { Tilemap } from "@/core/application/tile/tilemap";

import { BaseLayerRenderer } from "./baseLayerRenderer";

type CreateTileLayerRendererContext = {
    layer: TileLayer;
    tilemap: Tilemap;
    gap: number;
}

export class TileLayerRenderer extends BaseLayerRenderer<TileLayer> {
    private sprites: Map<string, Sprite> = new Map(); // Id -> Sprite

    constructor(context: CreateTileLayerRendererContext) {
        super(context.layer, context.tilemap);
        this.gap = context.gap;
        
        // Initial render
        this.renderLayer();
        this.layer.eventEmitter.on("tileChanged", this.onTileChanged);
    }

    private renderLayer(): void {
        const { width, height } = this.layer.size;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                this.renderTile(x, y);
            }
        }
    }

    private onTileChanged = (x: number, y: number) => {
        this.renderTile(x, y);
    };

    private renderTile(x: number, y: number): void {
        const key = `${x},${y}`;
        const tileRefResult = this.layer.getTileRefAt({ x, y });
        const currentSprite = this.sprites.get(key);

        if (tileRefResult.status !== "Success" || !tileRefResult.data) {
            if (currentSprite) {
                this.container.removeChild(currentSprite);
                currentSprite.destroy();
                this.sprites.delete(key);
            }
            return;
        }

        const tileRef = tileRefResult.data;

        const tilesetRefData = this.layer.tilesetRefManager.tilesetRef.find(r => r.index === tileRef.getTile().tilesetIndex);
        if (!tilesetRefData) return;

        const tilesetResult = this.layer.tilesetRefManager.getTilesetById(tilesetRefData.id);
        if (tilesetResult.status !== "Success" || !tilesetResult.data) return;

        const tileset = tilesetResult.data;
        const tile = tileset.getTileFromId(tileRef.getTile().tileId);
        
        if (!tile) {
            if (currentSprite) {
                this.container.removeChild(currentSprite);
                currentSprite.destroy();
                this.sprites.delete(key);
            }
            return;
        }
        const texture = tile.getTexture();
        
        // Calculate Position: (GridPos + LayerGridOffset) * (TileSize + Gap) + LayerPixelOffset
        const posX = (x + this.layer.coordinate.col) * (this.tilemap.tilewidth + this.gap) + this.layer.offset.x;
        const posY = (y + this.layer.coordinate.row) * (this.tilemap.tileheight + this.gap) + this.layer.offset.y;

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
        (this.layer.eventEmitter as any).off("tileChanged", this.onTileChanged);
        super.destroy();
        this.sprites.clear();
    }
}