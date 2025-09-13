import { Container, Sprite } from "pixi.js";

import { CreateTilemapRendererContext, ITilemapRenderer, ITilemapRendererContructor } from "@/appcore/interface/renderer/ITilemapRenderer";

import { DefaultTilemap } from "../tile/defaultTilemap";

export class TilemapRendererFactory implements ITilemapRendererContructor {
    public createTilemapRenderer(context: CreateTilemapRendererContext): ITilemapRenderer {
        return new DefaultTilemapRenderer(context);
    }
}

export class DefaultTilemapRenderer implements ITilemapRenderer {
    protected mainContainer: Container;
    protected tilemap: DefaultTilemap;
    
    constructor(context: CreateTilemapRendererContext) {
        this.tilemap = context.tilemap as DefaultTilemap;
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