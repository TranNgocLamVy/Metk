import { DefaultTilemap } from "@/core/default/tile/defaultTilemap";

import { TilesetManager } from "./tilesetManager";

export class TilemapManager {
    private tilesetManager: TilesetManager;
    private tilemapMap: Map<string, DefaultTilemap | null> = new Map<string, DefaultTilemap | null>();

    public constructor(tilesetManager: TilesetManager) {
        this.tilesetManager = tilesetManager;
    }

    public getTilemapPaths(): string[] {
        return Array.from(this.tilemapMap.keys());
    }

    public addTilemapPath(filePath: string) {
        this.tilemapMap.set(filePath, null);
    }

    public addTilemapPaths(filePath: string[]) {
        filePath.forEach((path) => {
            this.tilemapMap.set(path, null);
        });
    }

    public async getTilemap(filePath: string): Promise<DefaultTilemap | null> {
        const tilemap = this.tilemapMap.get(filePath);

        if (tilemap === undefined) return null;
        if (tilemap === null) {
            const loadedTilemap = await DefaultTilemap.loadTilemap(filePath, { tilesetManager: this.tilesetManager });
            this.tilemapMap.set(filePath, loadedTilemap);
            return loadedTilemap;
        }
        return tilemap;
    }

    public async getTilemaps(): Promise<DefaultTilemap[]> {
        const filePaths = Array.from(this.tilemapMap.keys());
        const tilemapPromises = filePaths.map(path => this.getTilemap(path));
        const results = await Promise.all(tilemapPromises);
        return results.filter((tm): tm is DefaultTilemap => tm !== null);
    }
}