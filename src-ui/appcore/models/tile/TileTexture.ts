import { Texture } from "pixi.js";

const tileTextureFinalizer = new FinalizationRegistry((texture: Texture) => {
    texture.destroy();
});

export class TileTexture {
    private texture: Texture;
    public tileWidth: number;
    public tileHeight: number;

    constructor(texture: Texture, tileWidth: number, tileHeight: number) {
        this.texture = texture;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        tileTextureFinalizer.register(this, texture);
    }

    public destroy(): void {
        tileTextureFinalizer.unregister(this);
        this.texture.destroy();
    }

    public get(): Texture {
        return this.texture;
    }
}
