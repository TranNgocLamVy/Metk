import { DefaultTilemap } from "@/appcore/default/tile/defaultTilemap";

export class TilemapManager {
    private tilemapMap: Map<string, DefaultTilemap> = new Map<string, DefaultTilemap>();

    public async loadTilemap(filePath: string, tilemap: DefaultTilemap) {
        this.tilemapMap.set(filePath, tilemap);
    }

    public getTilemap(filePath: string): DefaultTilemap | null {
        const tilemap = this.tilemapMap.get(filePath);
        return tilemap ? tilemap : null;
    }

    public getTilemaps(): DefaultTilemap[] {
        return Array.from(this.tilemapMap.values());
    }
}