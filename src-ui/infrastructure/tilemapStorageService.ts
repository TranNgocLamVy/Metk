import { type } from "arktype";

import { ITilemapStorageService } from "@/infrastructure/interface/ITilemapStorageService";
import { TilemapData, TilemapDataSchema } from "@/shared/schema/tilemapSchema";
import { Result } from "@/shared/types/result";
import { exists, readTextFile } from "@tauri-apps/plugin-fs";

export class JsonTilemapStorageService implements ITilemapStorageService {
    public async loadTilemap(filePath: string): Promise<Result<TilemapData | null>> {
        const exist = await exists(filePath);
        if (!exist) return { status: "Error", message: "File not found", data: null };
        const tilemapRawData = await readTextFile(filePath);
        if (!tilemapRawData) return { status: "Error", message: "File not found", data: null };
        const projectData = TilemapDataSchema(tilemapRawData);
        if (projectData instanceof type.errors) {
            console.error(projectData.summary);
            return { status: "Error", message: "Invalid file", data: null };
        }
        return { status: "Success", data: projectData };
    }

    public async saveTilemap(filePath: string, content: any): Promise<void> {
        // await FileUtils.writeTextFile(filePath, this.baseDirectory, JSON.stringify(content));
    }
}