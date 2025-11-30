import { TilesetData } from "../schema/tilesetSchema";

export interface ITilesetStorageService {
    loadTileset(filePath: string): Promise<TilesetData | null>;
    saveTilesett(filePath: string, content: any): Promise<void>;
}