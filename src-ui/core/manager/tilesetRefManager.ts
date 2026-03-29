import { TilesetRefData } from "@/shared/schema/tilemapSchema";
import { PathUtils } from "@/shared/utils/pathUtils";

import { Tileset } from "../application/tile/tileset";
import { TilesetManager } from "./tilesetManager";
import { FilePathSystem } from "@/infrastructure/projectPathSystem";
import { TilesetMetadata } from "@/shared/schema/tilesetSchema";

export class TilesetRefManager {
    public tilesetRef: TilesetRefData[]
    private nextTilesetIndex: number;

    constructor(
        public readonly tilesetManager: TilesetManager,
        public readonly tilemapPathSystem: FilePathSystem,
    ) { }

    public load(tilesetRef: TilesetRefData[]) {
        this.tilesetRef = tilesetRef;

        if (this.tilesetRef.length === 0) {
            this.nextTilesetIndex = 0;
        } else {
            const maxIndex = Math.max(...this.tilesetRef.map(tileset => tileset.index));
            this.nextTilesetIndex = maxIndex + 1;
        }
    }

    public serialize(): TilesetRefData[] { return this.tilesetRef; }

    public getTilesetIndex(tileset: TilesetMetadata): number {
        const tilesetRef = this.tilesetRef.find(tilesetRef => tilesetRef.id === tileset.id);
        if (!tilesetRef) {
            const tilesetAbsPath = this.tilesetManager.getTilesetAbsById(tileset.id);
            if (!tilesetAbsPath) return -1;
        
            const tilesetRelPath = PathUtils.relative(this.tilemapPathSystem.relDir, tilesetAbsPath);

            const newTilesetRef: TilesetRefData = {
                index: this.nextTilesetIndex,
                id: tileset.id,
                name: tileset.name,
                source: tilesetRelPath,
            }
            this.tilesetRef.push(newTilesetRef);
            this.nextTilesetIndex += 1;
            return newTilesetRef.index;
        }
        return tilesetRef.index;
    }

    public getTilesetIndexById(tilesetId: string): number {
        const tilesetMetadata = this.tilesetManager.getTilesetMetadataById(tilesetId);
        if (!tilesetMetadata) return -1;
        return this.getTilesetIndex(tilesetMetadata);
    }

    public getTilesetById(id: string): Tileset | null {
        return this.tilesetManager.getTilesetById(id);
    }
}