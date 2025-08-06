import { BaseTileMap } from "@/plugin-api";

export class TileMapRestry {
    private static instance: TileMapRestry;
    private tileMaps: Map<string, typeof BaseTileMap>;

    private constructor() {
        this.tileMaps = new Map();
    }

    public static Instance(): TileMapRestry {
        if (!this.instance) {
            this.instance = new TileMapRestry();
        }
        return this.instance;
    }

    public registerTileMap(name: string, tileMap: typeof BaseTileMap): void {
        this.tileMaps.set(name, tileMap);
    }

    public getTileMap(name: string): typeof BaseTileMap | undefined {
        return this.tileMaps.get(name);
    }

}