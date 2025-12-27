import { TilesetRefData } from "@/shared/schema/tilemapSchema";
import { ErrorResult, Result, SuccessResult } from "@/shared/types/result";
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

        const maxIndex = Math.max(...this.tilesetRef.map(tileset => tileset.index))
        this.nextTilesetIndex = maxIndex ? (maxIndex + 1) : 0;
    }

    public serialize(): TilesetRefData[] { return this.tilesetRef; }

    public getTilesetIndex(tileset: Tileset): number {
        const tilesetRef = this.tilesetRef.find(tilesetRef => tilesetRef.id === tileset.id);
        if (!tilesetRef) {
            const tilesetAbsPathResult = this.tilesetManager.getTilesetAbsById(tileset.id);
            if (!tilesetAbsPathResult.data) return -1;

            const tilesetAbsPath = tilesetAbsPathResult.data;
            const tilesetRelPath = PathUtils.relative(this.tilemapAbsPath, tilesetAbsPath);

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
        const tilesetResult = this.tilesetManager.getTilesetById(tilesetId);
        if (!tilesetResult.data) return -1;
        return this.getTilesetIndex(tilesetResult.data);
    }

    public getTilesetById(id: string): Result<Tileset> {
        return this.tilesetManager.getTilesetById(id);
    }

    public getTilesetByRelPath(tilesetRelPath: string): Result<Tileset> {
        const tilesetAbsPath = PathUtils.join(this.tilemapAbsPath, tilesetRelPath);
        const relPathFromProject = PathUtils.relative(this.projectDir, tilesetAbsPath);
        return this.tilesetManager.getTilesetByRelPath(relPathFromProject);
    }

} 