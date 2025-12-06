import { type } from "arktype";

import { ITilesetStorageService } from "@/core/interface/ITilesetStorageService";
import { TilesetData, tilesetDataSchema } from "@/shared/schema/tilesetSchema";
import { Result } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/pathUtils";
import { create, exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

export class JsonTilesetStorageService implements ITilesetStorageService {
    constructor(public readonly projectDir: string) { }

    public async loadTileset(tilesetRelPath: string): Promise<Result<TilesetData>> {
        const tilesetAbsPath = await PathUtils.join(this.projectDir, tilesetRelPath);

        const exist = await exists(tilesetAbsPath);
        if (!exist) return { status: "Error", message: "File not found" };

        const tilesetRawData = await readTextFile(tilesetAbsPath);
        if (!tilesetRawData) return { status: "Error", message: "Error while reading file" };

        const tilesetData = tilesetDataSchema(tilesetRawData);
        if (tilesetData instanceof type.errors) {
            console.error(tilesetData.summary);
            return { status: "Error", message: "Invalid tileset format" };
        }
        return { status: "Success", data: tilesetData };
    }

    public async saveTileset(tilesetRelPath: string, content: any): Promise<Result> {
        const fullTilesetPath = await PathUtils.join(this.projectDir, tilesetRelPath);
        const exist = await exists(fullTilesetPath);
        if (exist) {
            await writeTextFile(fullTilesetPath, JSON.stringify(content));
        } else {
            const file = await create(fullTilesetPath);
            await file.write(new TextEncoder().encode(JSON.stringify(content)));
            await file.close();
        }

        return { status: "Success", data: null };
    }
}