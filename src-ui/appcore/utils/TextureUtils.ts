import { ImageSource, Rectangle, Texture } from "pixi.js";

import { readFile } from "@tauri-apps/plugin-fs";

export class TextureUtils {
    public static async loadTextureFromPath(filePath: string): Promise<Texture | null> {
        try {
            const fileBuffer = await readFile(filePath);

            const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'image/png' });
            const url = URL.createObjectURL(blob);

            const image = new Image();
            image.src = url;
            await image.decode();

            return new Texture({ source: new ImageSource({ resource: image, scaleMode: "nearest" }) });
        } catch (error) {
            console.error(error);
            return null;
        }
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