import { ImageSource, Texture } from "pixi.js";

import { Result } from "@/shared/types/result";
import { join } from "@tauri-apps/api/path";
import { exists, readFile } from "@tauri-apps/plugin-fs";

export class TextureService {

    constructor(public tilesetDir: string) { }

    public async loadTexture(textureRelPath: string): Promise<Result<Texture | null>> {
        const textureAbsPath = await join(this.tilesetDir, textureRelPath);
        const exist = await exists(textureAbsPath);
        if (!exist) return { status: "Error", message: `Texture file not found at ${textureAbsPath}`, data: null };
        try {
            const fileBuffer = await readFile(textureAbsPath);

            const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'image' });
            const url = URL.createObjectURL(blob);

            const image = new Image();
            image.src = url;
            await image.decode();

            const texture = new Texture({ source: new ImageSource({ resource: image, scaleMode: "nearest" }) })
            return { status: "Success", data: texture };
        } catch (error) {
            console.error(error);
            return { status: "Error", message: `Failed to load texture error: ${error}`, data: null };
        }
    }
}