import { type } from "arktype";
import stringify from "json-stringify-pretty-compact";

import { ITilesetStorageService } from "@/infrastructure/interface/ITilesetStorageService";
import { TilesetData, tilesetDataSchema } from "@/shared/schema/tilesetSchema";
import { Result } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/pathUtils";
import { create, exists, readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";

export class JsonTilesetStorageService implements ITilesetStorageService {
    constructor(public projectDir: string) { }

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

    public async saveTileset(tilesetRelPath: string, content: TilesetData): Promise<Result> {
        const tilesetAbsPath = await PathUtils.join(this.projectDir, tilesetRelPath);
        const stringContent = stringify(content, { maxLength: 80, indent: 2 })
        const exist = await exists(tilesetAbsPath);
        if (exist) {
            await writeTextFile(tilesetAbsPath, stringContent);
        } else {
            const file = await create(tilesetAbsPath);
            await file.write(new TextEncoder().encode(stringContent));
            await file.close();
        }

        return { status: "Success", data: null };
    }
}