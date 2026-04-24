import { PathUtils } from "@/shared/utils/pathUtils";

import { TilesetManager } from "./tilesetManager";
import { FilePathSystem } from "@/infrastructure/projectPathSystem";
import { TilesetMetadata, TilesetRefData } from "@/shared/schema/tilesetSchema";

export class TilesetRefManager {
    public tilesetRefs: TilesetRefData[] = []
    private nextIndex: number;

    constructor(
        public readonly tilesetManager: TilesetManager,
        public readonly filePathSystem: FilePathSystem,
    ) { }

    public load(tilesetRefs: TilesetRefData[], nextIndex: number) {
        this.tilesetRefs = tilesetRefs;
        this.nextIndex = nextIndex;
    }

    public getTilesetIndex(tileset: TilesetMetadata): number {
        const tilesetRef = this.tilesetRefs.find(tilesetRef => tilesetRef.id === tileset.id);
        if (!tilesetRef) {
            const newTilesetRef: TilesetRefData = {
                index: this.nextIndex,
                id: tileset.id,
                name: tileset.name,
            }
            this.tilesetRefs.push(newTilesetRef);
            this.nextIndex += 1;
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

    public getRefIds(): string[] {
        const ids = this.tilesetRefs.map(ref => ref.id);
        return ids;
    }

    public serialize() {
        return {
            refs: Array.from(this.tilesetRefs),
            nextIndex: this.nextIndex,
        }
    }    

}