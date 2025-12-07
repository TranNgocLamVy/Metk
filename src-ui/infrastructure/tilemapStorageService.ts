import { type } from "arktype";
import stringify from "json-stringify-pretty-compact";

import { ITilemapStorageService } from "@/infrastructure/interface/ITilemapStorageService";
import { TilemapData, TilemapDataSchema } from "@/shared/schema/tilemapSchema";
import { Result } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/pathUtils";
import { create, exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

export class JsonTilemapStorageService implements ITilemapStorageService {
    constructor(public projectDir: string) { }

    public async loadTilemap(tilemapRelPath: string): Promise<Result<TilemapData>> {
        const tilemapAbsPath = PathUtils.join(this.projectDir, tilemapRelPath);

        const exist = await exists(tilemapAbsPath);
        if (!exist) return { status: "Error", message: "File not found" };

        const tilemapRawData = await readTextFile(tilemapAbsPath);
        if (!tilemapRawData) return { status: "Error", message: "File not found" };

        const projectData = TilemapDataSchema(tilemapRawData);
        if (projectData instanceof type.errors) {
            console.error(projectData.summary);
            return { status: "Error", message: "Invalid tilemap format" };
        }
        return { status: "Success", data: projectData };
    }

    public async saveTilemap(tilemapRelPath: string, content: TilemapData): Promise<Result> {
        const tilemapAbsPath = PathUtils.join(this.projectDir, tilemapRelPath);
        const stringContent = stringify(content, { maxLength: 80, indent: 2 })
        const exist = await exists(tilemapAbsPath);
        if (exist) {
            await writeTextFile(tilemapAbsPath, stringContent);
        } else {
            const file = await create(tilemapAbsPath);
            await file.write(new TextEncoder().encode(stringContent));
            await file.close();
        }
        return { status: "Success", data: null };
    }
}