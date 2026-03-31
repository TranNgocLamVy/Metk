import { TextureService } from "@/infrastructure/textureService";
import { Result } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/pathUtils";

import { TilesetData, TilesetMetadata } from "../../shared/schema/tilesetSchema";
import { Tileset } from "../application/tile/tileset";
import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/projectPathSystem";
import { TilesetStorageService } from "@/infrastructure/container";

export class TilesetManager {
    private tilesetMetadata: Map<string, TilesetMetadata> = new Map<string, TilesetMetadata>(); // id -> tilesetMetadata
    private loadedTilesets: Map<string, Tileset> = new Map<string, Tileset>(); // id -> tileset

    private pendingLoads: Map<string, Promise<Result<Tileset>>> = new Map(); // tilesetId -> loadTileset Promise

    public constructor(
        private readonly projectPathSystem: ProjectPathSystem,
    ) { }

    public addTilesetMetadata(tilesetMetadata: TilesetMetadata): void {
        this.tilesetMetadata.set(tilesetMetadata.id, tilesetMetadata);
    }

    public async loadTilesetsMetadata(tilesetsMetadata: TilesetMetadata[]): Promise<void> {
        this.tilesetMetadata = new Map<string, TilesetMetadata>(tilesetsMetadata.map((meta) => [meta.id, meta]));
    }

    public async loadTileset(id: string): Promise<Result> {
        if (this.loadedTilesets.has(id)) return Result.Success(this.loadedTilesets.get(id)!);

        if (this.pendingLoads.has(id)) return this.pendingLoads.get(id)!;

        const loadPromise = this.performTilesetLoad(id);
        this.pendingLoads.set(id, loadPromise);

        try {
            return await loadPromise;
        } catch (error) {
            return Result.Error(`Failed to load tileset, error: ${error}`);
        } finally {
            this.pendingLoads.delete(id);
        }
    }

    private async performTilesetLoad(id: string): Promise<Result<Tileset>> {
        const metaData = this.tilesetMetadata.get(id);
        if (!metaData) return Result.Error(`Tileset metadata not found for id: ${id}`);

        const tilesetAbsPath = this.projectPathSystem.getAbsPathFromRelPath(metaData.tilesetRelPath);
        const loadTilesetResult = await TilesetStorageService.load(tilesetAbsPath);

        if (loadTilesetResult.status !== Result.Status.Success) {
            return Result.Error(loadTilesetResult.message);
        }

        const tilesetData = loadTilesetResult.data;

        const tilesetPathSystem = new FilePathSystem(metaData.id, this.projectPathSystem, metaData.tilesetRelPath);
        const tileset = new Tileset(tilesetData, new TextureService(tilesetPathSystem.getFileAbsDir()), tilesetPathSystem);

        await tileset.loadTexture();

        this.loadedTilesets.set(tilesetData.id, tileset);

        return Result.Success(tileset);
    }

    public async unloadTileset(id: string): Promise<void> {
        const tilesetMetadata = this.tilesetMetadata.get(id);
        if (!tilesetMetadata) return;

        const tileset = this.loadedTilesets.get(id);
        if (!tileset) return;

        await tileset.unloadTexture();

        this.loadedTilesets.delete(id);
    }

    public async saveTileset(id: string): Promise<Result> {
        const tileset = this.loadedTilesets.get(id);
        if (tileset == undefined) return Result.Error("Tileset not found");

        const tilesetData = tileset.serialize();
        return TilesetStorageService.save(tileset.tilesetPathSystem.getFileAbsDir(), tilesetData);
    }

    public getTilesetById(id: string): Tileset | null {
        const tileset = this.loadedTilesets.get(id);
        if (tileset === undefined) return null
        return tileset;
    }

    public getTilesetMetadataById(id: string): TilesetMetadata | null {
        const tilesetMetadata = this.tilesetMetadata.get(id);
        if (!tilesetMetadata) return null;
        return tilesetMetadata;
    }

    public getTilesetAbsById(id: string): string | null {
        const tilesetMetadata = this.tilesetMetadata.get(id);
        if (!tilesetMetadata) return null;

        return this.projectPathSystem.getAbsPathFromRelPath(tilesetMetadata.tilesetRelPath);
    }

    public async createTileset(tilesetData: TilesetData, tilesetAbsPath: string): Promise<Result<Tileset>> {
        const tilesetDir = PathUtils.dirname(tilesetAbsPath);
        const textureService = new TextureService(tilesetDir)
        const tilesetPathSystem = new FilePathSystem(tilesetData.id, this.projectPathSystem, tilesetAbsPath);
        const newTileset = new Tileset(tilesetData, textureService, tilesetPathSystem);
        await newTileset.loadTexture();
        this.loadedTilesets.set(newTileset.id, newTileset);
        const result = await this.saveTileset(newTileset.id);
        if (result.status === Result.Status.Success) {
            return Result.Success(newTileset);
        } else {
            this.loadedTilesets.delete(newTileset.id);
            return Result.Error(result.message);
        }
    }

    public serialize(): TilesetMetadata[] {
        return Array.from(this.tilesetMetadata.values()).map((tilesetMetadata) => {
            const tileset = this.loadedTilesets.get(tilesetMetadata.id);
            if (!tileset) return tilesetMetadata;
            return { name: tileset.name, id: tileset.id, tilesetRelPath: tileset.tilesetPathSystem.relPath };
        });
    }
}