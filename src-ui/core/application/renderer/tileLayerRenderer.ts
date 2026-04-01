import { Sprite, Texture } from "pixi.js";

import { TileLayer } from "@/core/application/tile/layer/tileLayer";
import { Tilemap } from "@/core/application/tile/tilemap";

import { BaseLayerRenderer } from "./baseLayerRenderer";
import { AppCore } from "@/core/appcore";

type CreateTileLayerRendererContext = {
    layer: TileLayer;
    tilemap: Tilemap;
    gap: number;
}

export class TileLayerRenderer extends BaseLayerRenderer<TileLayer> {
    private sprites: Map<string, Sprite> = new Map(); // Id -> Sprite

    private bindOnTileChanged: (x: number, y: number) => void

    constructor(context: CreateTileLayerRendererContext) {
        super(context.layer, context.tilemap);
        this.gap = context.gap;

        this.bindOnTileChanged = this.onTileChanged.bind(this);

        // Initial render
        this.renderLayer();
        this.layer.eventEmitter.on("tileChanged", this.bindOnTileChanged);
    }

    private renderLayer(): void {
        const { width, height } = this.layer.size;
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                this.renderTile(x, y);
            }
        }
    }

    private onTileChanged(x: number, y: number) {
        this.renderTile(x, y);
    };

    private renderTile(x: number, y: number): void {
        const tileRef = this.layer.getTileAt({ col: x, row: y });
        const key = `${x},${y}`;
        const currentSprite = this.sprites.get(key);
        if (!tileRef) {
            if (currentSprite) {
                this.container.removeChild(currentSprite);
                currentSprite.destroy();
                this.sprites.delete(key);
            }
            return;
        }

        const tilesetRefData = this.layer.tilesetRefManager.tilesetRef.find(r => r.index === tileRef.getTile().tilesetIndex);
        if (!tilesetRefData) return;

        const tileset = this.layer.tilesetRefManager.tilesetManager.getTilesetById(tilesetRefData.id);

        // TODO: Handle unfound tileset, render error texture
        let texture: Texture;
        if (tileset && tileset.getTileFromId(tileRef.getTile().tileId)) {
            const tile = tileset.getTileFromId(tileRef.getTile().tileId)!;
            texture = tile.getTexture();
        } else {
            // TODO: Handle unfound tile, render error texture
            return;
        }

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
        this.layer.eventEmitter.off("tileChanged", this.bindOnTileChanged);
        super.destroy();
        this.sprites.clear();
    }
}