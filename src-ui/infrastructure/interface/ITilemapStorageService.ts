import { Result } from "@/shared/types/result";

import { TilemapData } from "../../shared/schema/tilemapSchema";

export interface ITilemapStorageService {
    projectDir: string;
    /**
     * Load Tilemap from filePath
     * @param tilemapRelPath relative path from projectDir
     */
    loadTilemap(tilemapRelPath: string): Promise<Result<TilemapData>>;
    /**
     * Save Tilemap to file using filePath
     * @param tilemapRelPath relative path from projectDir
     * @param content Tilemap data
     */
    saveTilemap(filePath: string, content: TilemapData): Promise<Result>;
}