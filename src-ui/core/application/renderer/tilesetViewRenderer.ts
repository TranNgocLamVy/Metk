import { Container, Sprite, Texture } from "pixi.js";

import { Tileset } from "../tile/tileset";

export type CreateTilesetRendererContext = {
    tileset: Tileset;
    parent: Container;
}

export class TilesetRenderer {
    protected container: Container;
    protected tileset: Tileset;

    constructor(context: CreateTilesetRendererContext) {
        this.tileset = context.tileset as Tileset;

        this.container = new Container();

        this.tileset.tiles.forEach((tile, index) => {
            const tex = tile.getTexture(); // fixed typo
            const sprite = this.makeTileSprite(tex, index, this.container);
            this.container.addChild(sprite);
        })

        context.parent.addChild(this.container);
    }

    public setParent(parent: Container) {
        this.container.removeFromParent();
        parent.addChild(this.container);
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
