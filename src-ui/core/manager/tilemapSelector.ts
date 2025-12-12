
import { Result } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/pathUtils";

import { Tile, Tileset } from "../application/tile/tileset";
import { TilesetManager } from "./tilesetManager";

export class TilesetSelector {
    constructor(
        public readonly tilesetManager: TilesetManager,
        public readonly projectDir: string,
        public readonly tilemapAbsPath: string,
    ) { }
    
    public getTilesetById(id: string): Result<Tileset> {
        return this.tilesetManager.getTilesetById(id);
    }

    public getTilesetByRelPath(tilesetRelPath: string): Result<Tileset> {
        const tilesetAbsPath = PathUtils.join(this.tilemapAbsPath, tilesetRelPath);
        const relPathFromProject = PathUtils.relative(this.projectDir, tilesetAbsPath);
        return this.tilesetManager.getTilesetByRelPath(relPathFromProject);
    }

    public getTile(tileId: number, tilesetId: string): Result<Tile | null> {
        const tilesetResult = this.getTilesetById(tilesetId);
        if (tilesetResult.status === "Success") {
            const tileset = tilesetResult.data;
            return { status: "Success", data: tileset.getTile(tileId) };
        }
        console.error("Tileset not found");
        return { status: "Error", message: "Tileset not found" };
    }
}