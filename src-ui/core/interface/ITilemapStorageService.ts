import { Result } from "@/shared/types/result";

import { TilemapData } from "../../shared/schema/tilemapSchema";

export interface ITilemapStorageService {
    
    loadTilemap(filePath: string): Promise<Result<TilemapData | null>>;
    saveTilemap(filePath: string, content: any): Promise<void>;
}