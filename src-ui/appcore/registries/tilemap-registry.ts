
import { BaseTilemap } from "@/plugin-api";

export class TileMapRestry {
    private tileMaps: Map<string, typeof BaseTilemap>;

    public constructor() {
        this.tileMaps = new Map();
    }

    public registerTileMap(name: string, tileMap: typeof BaseTilemap): void {
        this.tileMaps.set(name, tileMap);
    }

    public getTileMap(name: string): typeof BaseTilemap | undefined {
        return this.tileMaps.get(name);
    }

}