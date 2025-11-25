import { DefaultTileset } from "@/core/default/tile/defaultTileset";

export class TilesetManager {
    private tilesetMap: Map<string, DefaultTileset | null> = new Map<string, DefaultTileset | null>();

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

    public async getTileset(filePath: string): Promise<DefaultTileset | null> {
        const tileset = this.tilesetMap.get(filePath);
        if (tileset === undefined) return null;
        if (tileset === null) {
            const loadedTileset = await DefaultTileset.loadTileset(filePath);
            this.tilesetMap.set(filePath, loadedTileset);
            return loadedTileset;
        }
        return tileset;
    }

    public async getTilesets(): Promise<DefaultTileset[]> {
        const filePaths = Array.from(this.tilesetMap.keys());
        const tilesetPromises = filePaths.map(path => this.getTileset(path));
        const results = await Promise.all(tilesetPromises);
        return results.filter((ts): ts is DefaultTileset => ts !== null);
    }
}