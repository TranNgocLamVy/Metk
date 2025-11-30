import { Container, Sprite } from "pixi.js";

import { Tilemap } from "../domain/tilemap";

export type CreateTilemapRendererContext = {
    tilemap: Tilemap;
}

export class TilemapRenderer {
    protected mainContainer: Container;
    protected tilemap: Tilemap;
    
    constructor(context: CreateTilemapRendererContext) {
        this.tilemap = context.tilemap as Tilemap;
    }

    public async initRenderer(container: Container) {
        this.mainContainer = container;
        for (const tilelayer of this.tilemap.tilelayers) {
            const layerContainer = new Container();
            this.mainContainer.addChild(layerContainer);

            const size = tilelayer.size;
            for (let y = 0; y < size.height; y++) {
                for (let x = 0; x < size.width; x++) {
                    const tileData = tilelayer.getTileAt({ x, y });
                    if (!tileData) continue;
                    const tileId = tileData.getId();
                    const tile = await this.tilemap.getTilesetTileById(tileId);
                    if (!tile) continue;
                    const sprite = new Sprite(tile.getTexture());
                    sprite.x = x * this.tilemap.tilewidth;
                    sprite.y = y * this.tilemap.tileheight;
                    layerContainer.addChild(sprite);
                }
            }
        }
    }
}