import { ImageSource, Rectangle, Texture } from "pixi.js";

import { readFile } from "@tauri-apps/plugin-fs";

export class TextureUtils {
    public static async loadTextureFromFile(filePath: string): Promise<Texture> {
        const fileBuffer = await readFile(filePath);
        const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'image/png' });
        const url = URL.createObjectURL(blob);

        const image = new Image();
        image.src = url;
        await image.decode();

        return new Texture({ source: new ImageSource({ resource: image, scaleMode: "nearest" }) });
    }

    public static sliceTexture(texture: Texture, tileWidth: number, tileHeight: number): Texture[] {
        const textures: Texture[] = [];
        const base = texture.source;

        const cols = Math.floor(base.width / tileWidth);
        const rows = Math.floor(base.height / tileHeight);

        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const frame = new Rectangle(
                    x * tileWidth,
                    y * tileHeight,
                    tileWidth,
                    tileHeight,
                );
                const slice = new Texture({ source: texture.source, frame });
                textures.push(slice);
            }
        }

        return textures;
    }
}