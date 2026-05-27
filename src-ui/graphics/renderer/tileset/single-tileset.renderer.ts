import { Container, Sprite, Texture } from "pixi.js";

import { Tileset } from "@/editor/model/tileset/tileset";
import { appKernel } from "@/application/bootstrap/app-kernel";

export type CreateTilesetRendererContext = {
    tileset: Tileset;
    parent: Container;
}

export class TilesetRenderer {
    public readonly container: Container;
    private tileset: Tileset;

    private sprites: Sprite[] = [];

    private bindOnTextureReloaded: (tilesetId: string) => void;

    constructor(context: CreateTilesetRendererContext) {
        this.tileset = context.tileset as Tileset;

        this.container = new Container();
        this.container.position.set(0, 0);

        this.bindOnTextureReloaded = this.onTextureReloaded.bind(this);
        appKernel.textureManager.on("onTextureReloaded", this.bindOnTextureReloaded);

        this.renderTiles();
    }

    public async renderTiles(): Promise<void> {
        const textureManager = appKernel.editorFacade.textureManager;
        this.container.removeChildren();
        let errorTexture: Texture | null = null;
        for (let i = 0; i < this.tileset.tiles.length; i++) {
            let texture = textureManager.getTileTexture(this.tileset.id, i);
            if (!texture) {
                if (!errorTexture) errorTexture = await textureManager.getErrorTexture();
                texture = errorTexture;
            }
            const sprite = this.makeTileSprite(texture, i, this.container);
            sprite.width = this.tileset.tilewidth;
            sprite.height = this.tileset.tileheight;
            this.sprites.push(sprite);
            this.container.addChild(sprite);
        }
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
        const x = (index % columns) * (tilewidth);
        const y = Math.floor(index / columns) * (tileheight);
        return { x, y };
    }

    private onTextureReloaded(tilesetId: string) {
        if (tilesetId === this.tileset.id) {
            this.renderTiles();
        }
    }

    public destroy(): void {
        this.sprites.forEach(s => s.destroy());
        this.container.destroy();
        appKernel.textureManager.off("onTextureReloaded", this.bindOnTextureReloaded);
    }
}
