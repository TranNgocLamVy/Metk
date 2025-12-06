import { Result } from "@/shared/types/result";

import { TilesetData } from "../../shared/schema/tilesetSchema";

export interface ITilesetStorageService {
    projectDir: string;
    /**
     * Load Tileset from filePath
     * @param tilsetRelPath relative path from projectDir
     */
    loadTileset(tilsetRelPath: string): Promise<Result<TilesetData>>;

    /**
     * Save Tileset to file using filePath
     * @param tilsetRelPath relative path from projectDir
     * @param content Tileset data
     */
    saveTileset(tilesetRelPath: string, content: any): Promise<Result>;
}