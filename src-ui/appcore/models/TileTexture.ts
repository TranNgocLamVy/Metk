import { Texture } from "pixi.js";

const tileTextureFinalizer = new FinalizationRegistry((texture: Texture) => {
    console.log("Texture finalized, destroying:", texture);
    texture.destroy();
});

export class TileTexture {
    public texture: Texture;
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
}
