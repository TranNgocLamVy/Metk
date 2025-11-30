import { type } from "arktype";

import { ITilemapStorageService } from "@/core/interface/ITilemapStorageService";
import { TilemapData, TilemapDataSchema } from "@/core/schema/tilemapSchema";
import { Result } from "@/shared/types/result";
import { FileUtils } from "@/shared/utils/FileUtils";
import { BaseDirectory } from "@tauri-apps/plugin-fs";

export class JsonTilemapStorageService implements ITilemapStorageService {
    private baseDirectory: BaseDirectory;

    constructor(baseDirectory: BaseDirectory) {
        this.baseDirectory = baseDirectory;
    }

    public async loadTilemap(filePath: string): Promise<Result<TilemapData | null>> {
        const tilemapRawData = await FileUtils.readTextFile(filePath, this.baseDirectory);
        if (!tilemapRawData) return { status: "Error", message: "File not found", data: null };
        const projectData = TilemapDataSchema(tilemapRawData);
        if (projectData instanceof type.errors) {
            console.error(projectData.summary);
            return { status: "Error", message: "Invalid file", data: null };
        }
        return { status: "Success", data: projectData };
    }

    public async saveTilemap(filePath: string, content: any): Promise<void> {
        await FileUtils.writeTextFile(filePath, this.baseDirectory, JSON.stringify(content));
    }
}