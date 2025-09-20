import { DefaultTileset } from "@/appcore/default/tile/defaultTileset";

export class TilesetManager {
    private tilesetMap: Map<string, DefaultTileset> = new Map<string, DefaultTileset>();

    public async loadTileset(filePath: string, tileset: DefaultTileset) {
        this.tilesetMap.set(filePath, tileset);
    }

    public getTileset(filePath: string): DefaultTileset | null {
        const tileset = this.tilesetMap.get(filePath);
        return tileset ? tileset : null;
    }

    public getTilesets(): DefaultTileset[] {
        return Array.from(this.tilesetMap.values());
    }
}