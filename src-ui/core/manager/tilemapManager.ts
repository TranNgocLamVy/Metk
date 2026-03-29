import { ToastService } from "@/shared/services/toastService";
import { Result } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/pathUtils";

import { TilemapData, TilemapMetadata } from "../../shared/schema/tilemapSchema";
import { Tilemap } from "../application/tile/tilemap";
import { TilesetManager } from "./tilesetManager";
import { TilesetRefManager } from "./tilesetRefManager";
import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/projectPathSystem";
import { TilemapStorageService } from "@/infrastructure/container";

export class TilemapManager {
    private tilemapMetadata: Map<string, TilemapMetadata> = new Map<string, TilemapMetadata>(); // id -> tilemapMetadata
    private loadedTilemap: Map<string, Tilemap> = new Map<string, Tilemap>(); // id -> tilemap

    public constructor(
        private readonly tilesetManager: TilesetManager,
        private readonly projectPathSystem: ProjectPathSystem,
    ) { }

    public async loadAll(tilemapsMetadata: TilemapMetadata[]): Promise<void> {
        await Promise.all(tilemapsMetadata.map(async (metaData) => {
            const tilemapAbsPath = this.projectPathSystem.getAbsPathFromRelPath(metaData.tilemapRelPath);

            const loadTilemapResult = await TilemapStorageService.load(tilemapAbsPath);
            if (loadTilemapResult.status === Result.Status.Success) {
                const tilemapData = loadTilemapResult.data;

                const tilemapPathSystem = new FilePathSystem(metaData.id, this.projectPathSystem, metaData.tilemapRelPath);
                const tilesetRefManager = new TilesetRefManager(this.tilesetManager, tilemapPathSystem);
                const tilemap = new Tilemap(tilemapData, tilesetRefManager);
                
                await tilemap.load();
                this.loadedTilemap.set(tilemapData.id, tilemap);
            } else if (loadTilemapResult.status === Result.Status.Error) {
                ToastService.error({ message: loadTilemapResult.message });
            }
        }));
    }

    public async saveTilemap(id: string): Promise<Result> {
        const tilemap = this.loadedTilemap.get(id);
        if (tilemap === undefined) return Result.Error("Tilemap not found")

        try {
            const tilemapData = tilemap.serialize();
            await TilemapStorageService.save(tilemap.tilemapPathSystem.getFileAbsPath(), tilemapData);
            return Result.Success();
        } catch (error) {
            return Result.Error(`Failed to save tilemap, error: ${error}`)
        }
    }

    public getTilemapsMetadata(): TilemapMetadata[] {
        return Array.from(this.tilemapMetadata.values());
    }

    public getTilemapById(id: string): Tilemap | null {
        const tilemap = this.loadedTilemap.get(id);
        return tilemap ?? null;
    }

    public async createTilemap(tilemapData: TilemapData, tilemapAbsPath: string): Promise<Result<Tilemap>> {
        const tilemapRefPath = PathUtils.relative(this.projectPathSystem.absDir, tilemapAbsPath);
        const tilemapPathSystem = new FilePathSystem(tilemapData.id, this.projectPathSystem, tilemapRefPath);
        const tilesetRefManager = new TilesetRefManager(this.tilesetManager, tilemapPathSystem);
        const newTilemap = new Tilemap(tilemapData, tilesetRefManager);
        await newTilemap.load();
        this.loadedTilemap.set(newTilemap.id, newTilemap);
        const result = await this.saveTilemap(newTilemap.id);
        if (result.status === Result.Status.Success) {
            return Result.Success(newTilemap);
        } else {
            this.loadedTilemap.delete(newTilemap.id);
            return Result.Error(result.message);
        }
    }

    public serialize(): TilemapMetadata[] {
        return Array.from(this.tilemapMetadata.values()).map((metaData) => {
            const tilemap = this.loadedTilemap.get(metaData.id);
            if (!tilemap) return metaData;
            return { name: tilemap.name, id: tilemap.id, tilemapRelPath: tilemap.tilemapPathSystem.relDir };
        });
    }
}