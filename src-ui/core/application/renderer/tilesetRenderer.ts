import { Container, Sprite, Texture } from "pixi.js";

import { Tileset } from "@/core/application/tile/tileset";

export type CreateTilesetRendererContext = {
    tileset: Tileset;
    parent: Container;
    gap: number;
}

export class TilesetRenderer {
    public readonly container: Container;
    private tileset: Tileset;
    private gap: number = 0;

    private sprites: Sprite[] = [];

    constructor(context: CreateTilesetRendererContext) {
        this.tileset = context.tileset as Tileset;
        this.gap = context.gap;

        this.container = new Container();
        this.container.position.set(0, 0);

        this.tileset.tiles.forEach((tile, index) => {
            const tex = tile.getTexture();
            const sprite = this.makeTileSprite(tex, index, this.container);
            this.sprites.push(sprite);
            this.container.addChild(sprite);
        })
    }

    public setGap(gap: number): void {
        this.gap = gap;
        this.rerenderTiles();
    }

    public rerenderTiles(): void {
        this.sprites.forEach((sprite, index) => {
            const { x, y } = this.indexToPos(index);
            sprite.position.set(x, y);
        });
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
        const x = (index % columns) * (tilewidth + this.gap);
        const y = Math.floor(index / columns) * (tileheight + this.gap);
        return { x, y };
    }

    public destroy(): void {
        this.container.destroy({ children: true });
    }
}
