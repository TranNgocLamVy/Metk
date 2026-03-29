import { ImageSource, Texture } from "pixi.js";

import { Result } from "@/shared/types/result";
import { exists, readFile } from "@tauri-apps/plugin-fs";

import { PathUtils } from "../shared/utils/pathUtils";

export class TextureService {
    constructor(public tilesetDir: string) { }

    public async loadTexture(textureRelPath: string): Promise<Result<Texture | null>> {
        const textureAbsPath = PathUtils.join(this.tilesetDir, textureRelPath);
        const exist = await exists(textureAbsPath);
        if (!exist) return Result.Error(`Texture file not found at ${textureAbsPath}`);
        try {
            const fileBuffer = await readFile(textureAbsPath);

            const blob = new Blob([new Uint8Array(fileBuffer)], { type: 'image' });
            const url = URL.createObjectURL(blob);

            const image = new Image();
            image.src = url;
            await image.decode();

            const texture = new Texture({ source: new ImageSource({ resource: image, scaleMode: "nearest" }) })
            return Result.Success(texture);
        } catch (error) {
            return Result.Error(`Failed to load texture error: ${error}`);
        }
    }
}