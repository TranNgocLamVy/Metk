import { Container, Sprite, Texture } from "pixi.js";

import { ITileset } from "@/appcore/interface/tile/ITileset";

import { DefaultTileset } from "../tile/defaultTileset";

export type CreateTilesetRendererContext = {
    tileset: ITileset;
}

export class DefaultTilesetRenderer {
    protected mainContainer: Container;
    protected tileset: DefaultTileset;

    constructor(context: CreateTilesetRendererContext) {
        this.tileset = context.tileset as DefaultTileset;
    }

    public async initRenderer(container: Container): Promise<void> {
        this.mainContainer = container;

        this.tileset.tiles.forEach((tile, index) => {
            const tex = tile.getTexture(); // fixed typo
            const sprite = this.makeTileSprite(tex, index, this.mainContainer);
            this.mainContainer.addChild(sprite);
        })
    }

    private makeTileSprite(texture: Texture, index: number, gridContainer: Container): Sprite {
        const s = new Sprite(texture);
        s.zIndex = 0;
        const { x, y } = this.indexToPos(index);
        s.position.set(x, y);
        return s;
    }

    private indexToPos(index: number): { x: number, y: number } {
        const tilewidth = this.tileset.tilewidth;
        const tileheight = this.tileset.tileheight;
        const columns = this.tileset.columns;
        const gap = 1;
        const x = (index % columns) * (tilewidth + gap);
        const y = Math.floor(index / columns) * (tileheight + gap);
        return { x, y };
    }
}
