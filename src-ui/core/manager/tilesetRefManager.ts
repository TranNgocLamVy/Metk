import { TilesetRefData } from "@/shared/schema/tilemapSchema";
import { ErrorResult, Result } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/pathUtils";

import { Tileset } from "../application/tile/tileset";
import { TilesetManager } from "./tilesetManager";

export class TilesetRefManager {
    public tilesetRef: TilesetRefData[]
    private nextTilesetIndex: number;

    constructor(
        public readonly tilesetManager: TilesetManager,
        public readonly projectDir: string,
        public readonly tilemapAbsPath: string,
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

    public getTilesetIndex(tileset: Tileset): number {
        const tilesetRef = this.tilesetRef.find(tilesetRef => tilesetRef.id === tileset.id);
        if (!tilesetRef) {
            const tilesetAbsPath = this.tilesetManager.getTilesetAbsById(tileset.id);
            if (!tilesetAbsPath) return -1;
            
            const tilemapDir = PathUtils.dirname(this.tilemapAbsPath);
            const tilesetRelPath = PathUtils.relative(tilemapDir, tilesetAbsPath);

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
        const tileset = this.tilesetManager.getTilesetById(tilesetId);
        if (!tileset) return -1;
        return this.getTilesetIndex(tileset);
    }

    public getTilesetById(id: string): Tileset | null {
        return this.tilesetManager.getTilesetById(id);
    }

    public getTilesetByRelPath(tilesetRelPath: string): Tileset | null {
        const tilemapDir = PathUtils.dirname(this.tilemapAbsPath);
        const tilesetAbsPath = PathUtils.join(tilemapDir, tilesetRelPath);
        
        const relPathFromProject = PathUtils.relative(this.projectDir, tilesetAbsPath);
        return this.tilesetManager.getTilesetByRelPath(relPathFromProject);
    }

    public getTilesetByIndex(index: number): Tileset | null {
        const tilesetRef = this.tilesetRef.find(tilesetRef => tilesetRef.index === index);
        if (!tilesetRef) return null

        return this.getTilesetById(tilesetRef.id);
    }

}