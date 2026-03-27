import { ToastService } from "@/shared/services/toastService";
import { Result } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/pathUtils";

import { TilemapData, TilemapMetaData } from "../../shared/schema/tilemapSchema";
import { Tilemap } from "../application/tile/tilemap";
import { TilesetManager } from "./tilesetManager";
import { TilesetRefManager } from "./tilesetRefManager";
import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/projectPathSystem";
import { TilemapStorageService } from "@/infrastructure/container";

export class TilemapManager {
    private tilemapMap: Map<string, Tilemap> = new Map<string, Tilemap>(); // id -> tilemap

    public constructor(
        private readonly tilesetManager: TilesetManager,
        private readonly projectPathSystem: ProjectPathSystem,
    ) { }

    public getTilemapsMetaData(): TilemapMetaData[] {
        const tilemapArray = Array.from(this.tilemapMap.values());
        return tilemapArray.map((tilemap) => ({ name: tilemap.name, id: tilemap.id, tilemapRelPath: tilemap.tilemapPathSystem.relDir }));
    }

    public async loadAll(tilemapsMetaData: TilemapMetaData[]): Promise<void> {
        await Promise.all(tilemapsMetaData.map(async (metaData) => {
            const tilemapAbsPath = this.projectPathSystem.getAbsPathFromRelPath(metaData.tilemapRelPath);

            const loadTilemapResult = await TilemapStorageService.load(tilemapAbsPath);
            if (loadTilemapResult.status === "Success") {
                const tilemapData = loadTilemapResult.data;

                const tilemapPathSystem = new FilePathSystem(metaData.id, this.projectPathSystem, metaData.tilemapRelPath);
                const tilesetRefManager = new TilesetRefManager(this.tilesetManager, tilemapPathSystem);
                const tilemap = new Tilemap(tilemapData, tilesetRefManager);
                
                await tilemap.load();
                this.tilemapMap.set(tilemapData.id, tilemap);
            } else if (loadTilemapResult.status === "Error") {
                ToastService.error({ message: loadTilemapResult.message });
            }
        }));
    }

    public async saveTilemap(id: string): Promise<Result> {
        const tilemap = this.tilemapMap.get(id);
        if (tilemap === undefined) return Result.Error("Tilemap not found")

        try {
            const tilemapData = tilemap.serialize();
            await TilemapStorageService.save(tilemap.tilemapPathSystem.getFileAbsPath(), tilemapData);
            return Result.Success();
        } catch (error) {
            return Result.Error(`Failed to save tilemap, error: ${error}`)
        }
    }

    public getAllTilemaps(): Tilemap[] {
        return Array.from(this.tilemapMap.values());
    }

    public getTilemapById(id: string): Tilemap | null {
        const tilemap = this.tilemapMap.get(id);
        return tilemap ?? null;
    }

    public async createTilemap(tilemapData: TilemapData, tilemapAbsPath: string): Promise<Result<Tilemap>> {
        const tilemapRefPath = PathUtils.relative(this.projectPathSystem.projectDir, tilemapAbsPath);
        const tilemapPathSystem = new FilePathSystem(tilemapData.id, this.projectPathSystem, tilemapRefPath);
        const tilesetRefManager = new TilesetRefManager(this.tilesetManager, tilemapPathSystem);
        const newTilemap = new Tilemap(tilemapData, tilesetRefManager);
        await newTilemap.load();
        this.tilemapMap.set(newTilemap.id, newTilemap);
        const result = await this.saveTilemap(newTilemap.id);
        if (result.status === "Success") {
            return Result.Success(newTilemap);
        } else {
            this.tilemapMap.delete(newTilemap.id);
            return Result.Error(result.message);
        }
    }
}