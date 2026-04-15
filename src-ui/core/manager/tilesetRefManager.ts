import { PathUtils } from "@/shared/utils/pathUtils";

import { TilesetManager } from "./tilesetManager";
import { FilePathSystem } from "@/infrastructure/projectPathSystem";
import { TilesetMetadata, TilesetRefData } from "@/shared/schema/tilesetSchema";

export class TilesetRefManager {
    public tilesetRefs: TilesetRefData[] = []
    private nextTilesetIndex: number;

    constructor(
        public readonly tilesetManager: TilesetManager,
        public readonly filePathSystem: FilePathSystem,
    ) { }

    public load(tilesetRefs: TilesetRefData[]) {
        this.tilesetRefs = tilesetRefs;

        if (this.tilesetRefs.length === 0) {
            this.nextTilesetIndex = 0;
        } else {
            const maxIndex = Math.max(...this.tilesetRefs.map(tileset => tileset.index));
            this.nextTilesetIndex = maxIndex + 1;
        }
    }

    public serialize(): TilesetRefData[] { return Array.from(this.tilesetRefs); }    

    public getTilesetIndex(tileset: TilesetMetadata): number {
        const tilesetRef = this.tilesetRefs.find(tilesetRef => tilesetRef.id === tileset.id);
        if (!tilesetRef) {
            const tilesetAbsPath = this.tilesetManager.getTilesetAbsById(tileset.id);
            if (!tilesetAbsPath) return -1;
        
            const absDir = this.filePathSystem.getFileAbsDir();

            const tilesetRelPath = PathUtils.relative(absDir, tilesetAbsPath);

            const newTilesetRef: TilesetRefData = {
                index: this.nextTilesetIndex,
                id: tileset.id,
                name: tileset.name,
                source: tilesetRelPath,
            }
            this.tilesetRefs.push(newTilesetRef);
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

    public getTilesetIdByIndex(index: number): string | null {
        const tilesetRef = this.tilesetRefs.find(tileset => tileset.index === index);
        if (!tilesetRef) return null;
        return tilesetRef.id;
    }
}