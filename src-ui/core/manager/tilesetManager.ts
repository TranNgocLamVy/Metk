import { Result } from "@/shared/types/result";

import { TilesetMetadata } from "../../shared/schema/tilesetSchema";
import { Tileset } from "../application/tile/tileset";
import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/projectPathSystem";
import { TilesetStorageService } from "@/infrastructure/container";

type LoadTilesetOptions = { id: string } | { tilesetRelPath: string };

export class TilesetManager {
    public readonly tilesetMetadata: Map<string, TilesetMetadata> = new Map<string, TilesetMetadata>(); // id -> tilesetMetadata
    private loadedTilesets: Map<string, Tileset> = new Map<string, Tileset>(); // id -> tileset

    private pendingLoads: Map<string, Promise<Result<Tileset>>> = new Map(); // tilesetRelPath -> loadTileset Promise

    public constructor(
        private readonly projectPathSystem: ProjectPathSystem,
    ) { }

    public addTilesetMetadata(tilesetMetadata: TilesetMetadata): void {
        this.tilesetMetadata.set(tilesetMetadata.id, tilesetMetadata);
    }

    public async setTilesetsMetadata(tilesetsMetadata: TilesetMetadata[]): Promise<void> {
        tilesetsMetadata.forEach((meta) => this.tilesetMetadata.set(meta.id, meta));
    }

    public async loadTileset(options: LoadTilesetOptions): Promise<Result<Tileset>> {
        let tilesetRelPath: string;

        if ('id' in options) {
            const id = options.id;
            if (this.loadedTilesets.has(id)) return Result.Success(this.loadedTilesets.get(id)!);

            const metadata = this.tilesetMetadata.get(id);
            if (!metadata) return Result.Error(`Tileset metadata not found for id: ${id}`);

            tilesetRelPath = metadata.tilesetRelPath;
        } else {
            tilesetRelPath = options.tilesetRelPath;
        }

        if (this.pendingLoads.has(tilesetRelPath)) return this.pendingLoads.get(tilesetRelPath)!;

        const loadPromise = this.performTilesetLoad(options);
        this.pendingLoads.set(tilesetRelPath, loadPromise);

        try {
            return await loadPromise;
        } catch (error) {
            return Result.Error(`Failed to load tileset, error: ${error}`);
        } finally {
            this.pendingLoads.delete(tilesetRelPath);
        }
    }

    private async performTilesetLoad(options: LoadTilesetOptions): Promise<Result<Tileset>> {
        let tilesetRelPath: string;
        let tilesetAbsPath: string;

        if ('id' in options) {
            const id = options.id;
            const metaData = this.tilesetMetadata.get(id);
            if (!metaData) return Result.Error(`Tileset metadata not found for id: ${id}`);

            tilesetRelPath = metaData.tilesetRelPath;
            tilesetAbsPath = this.projectPathSystem.getAbsPathFromRelPath(metaData.tilesetRelPath);
        } else {
            tilesetRelPath = options.tilesetRelPath;
            tilesetAbsPath = this.projectPathSystem.getAbsPathFromRelPath(tilesetRelPath);
        }

        const loadTilesetResult = await TilesetStorageService.load(tilesetAbsPath);

        if (loadTilesetResult.status !== Result.Status.Success) return Result.Error(loadTilesetResult.message);

        const tilesetData = loadTilesetResult.data;

        const tilesetPathSystem = new FilePathSystem(tilesetData.id, this.projectPathSystem, tilesetRelPath);
        const tileset = new Tileset(tilesetData, tilesetPathSystem);

        this.tilesetMetadata.set(tilesetData.id, { id: tilesetData.id, name: tilesetData.name, tilesetRelPath });
        this.loadedTilesets.set(tilesetData.id, tileset);

        return Result.Success(tileset);

    }

    public async unloadTileset(id: string): Promise<void> {
        const tilesetMetadata = this.tilesetMetadata.get(id);
        if (!tilesetMetadata) return;

        const tileset = this.loadedTilesets.get(tilesetMetadata.id);
        if (!tileset) return;

        this.loadedTilesets.delete(tilesetMetadata.id);
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

    public serialize(): TilesetMetadata[] {
        return Array.from(this.tilesetMetadata.values()).map((tilesetMetadata) => {
            const tileset = this.loadedTilesets.get(tilesetMetadata.id);
            if (!tileset) return tilesetMetadata;
            return { name: tileset.name, id: tileset.id, tilesetRelPath: tileset.tilesetPathSystem.relPath };
        });
    }
}