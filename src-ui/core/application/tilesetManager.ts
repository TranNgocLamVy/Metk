import { Tileset } from "@/core/domain/tileset";

export class TilesetManager {
    private tilesetMap: Map<string, Tileset | null> = new Map<string, Tileset | null>();

    public getTilemapPaths(): string[] {
        return Array.from(this.tilesetMap.keys());
    }

    public addTilesetPath(filePath: string) {
        this.tilesetMap.set(filePath, null);
    }

    public addTilesetPaths(filePath: string[]) {
        filePath.forEach((path) => {
            this.tilesetMap.set(path, null);
        });
    }

    public async getTileset(filePath: string): Promise<Tileset | null> {
        const tileset = this.tilesetMap.get(filePath);
        if (tileset === undefined) return null;
        if (tileset === null) {
            const loadedTileset = await Tileset.loadTileset(filePath);
            this.tilesetMap.set(filePath, loadedTileset);
            return loadedTileset;
        }
        return tileset;
    }

    public async getTilesets(): Promise<Tileset[]> {
        const filePaths = Array.from(this.tilesetMap.keys());
        const tilesetPromises = filePaths.map(path => this.getTileset(path));
        const results = await Promise.all(tilesetPromises);
        return results.filter((ts): ts is Tileset => ts !== null);
    }
}