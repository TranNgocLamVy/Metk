import { ToastService } from "@/shared/services/toastService";
import { Result } from "@/shared/types/result";

import { TilemapMetadata } from "../../shared/schema/tilemapSchema";
import { Tilemap } from "../application/tile/tilemap";
import { TilesetManager } from "./tilesetManager";
import { TilesetRefManager } from "./tilesetRefManager";
import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/projectPathSystem";
import { TilemapStorageService } from "@/infrastructure/container";
import { RulesetRefManager } from "./rulesetRefManager";
import { RulesetManager } from "./rulesetManager";

export class TilemapManager {
    public readonly tilemapMetadata: Map<string, TilemapMetadata> = new Map<string, TilemapMetadata>(); // id -> tilemapMetadata
    private loadedTilemaps: Map<string, Tilemap> = new Map<string, Tilemap>(); // id -> tilemap

    private pendingLoads: Map<string, Promise<Result<Tilemap>>> = new Map(); // tilemapId -> loadTilemap Promise

    public constructor(
        private readonly tilesetManager: TilesetManager,
        private readonly rulesetManager: RulesetManager,
        private readonly projectPathSystem: ProjectPathSystem,
    ) { }

    public addTilemapMetadata(tilemapMetadata: TilemapMetadata): void {
        this.tilemapMetadata.set(tilemapMetadata.id, tilemapMetadata);
    }

    public loadTilemapsMetada(tilemapsMetadata: TilemapMetadata[]): void {
        tilemapsMetadata.forEach((meta) => this.tilemapMetadata.set(meta.id, meta));
    }

    public async loadTilemap(id: string): Promise<Result<Tilemap>> {
        if (this.loadedTilemaps.has(id)) return Result.Success(this.loadedTilemaps.get(id)!)

        if (this.pendingLoads.has(id)) return this.pendingLoads.get(id)!;

        const loadPromise = this.performTilemapLoad(id);
        this.pendingLoads.set(id, loadPromise);

        try {
            return await loadPromise;
        } catch (error) {
            return Result.Error(`Failed to load tilemap, error: ${error}`);
        } finally {
            this.pendingLoads.delete(id);
        }
    }

    private async performTilemapLoad(id: string): Promise<Result<Tilemap>> {
        const metaData = this.tilemapMetadata.get(id);
        if (!metaData) return Result.Error(`Tilemap metadata not found for id: ${id}`);

        const tilemapAbsPath = this.projectPathSystem.getAbsPathFromRelPath(metaData.tilemapRelPath);
        const loadTilemapResult = await TilemapStorageService.load(tilemapAbsPath);

        if (loadTilemapResult.status !== Result.Status.Success) {
            return Result.Error(loadTilemapResult.message);
        }

        const tilemapData = loadTilemapResult.data;

        const tilemapPathSystem = new FilePathSystem(metaData.id, this.projectPathSystem, metaData.tilemapRelPath);
        const tilesetRefManager = new TilesetRefManager(this.tilesetManager, tilemapPathSystem);
        const rulesetRefManager = new RulesetRefManager(this.rulesetManager, tilemapPathSystem);
        const tilemap = new Tilemap(tilemapData, tilesetRefManager, rulesetRefManager);

        await tilemap.load();

        this.loadedTilemaps.set(tilemapData.id, tilemap);

        let addMoreTileset: boolean = false;
        await Promise.all(tilemapData.tilesets.refs.map(tilesetRef => {
            if (this.tilesetManager.tilesetMetadata.has(tilesetRef.id)) {
                return this.tilesetManager.loadTileset({ id: tilesetRef.id })
            } else {
                addMoreTileset = true;
                const tilesetAbsPath = tilemapPathSystem.getAbsPathFromRelPath(tilesetRef.source);
                const tilesetRelPathFromProject = this.projectPathSystem.getRelPathFromAbsPath(tilesetAbsPath);
                return this.tilesetManager.loadTileset({ tilesetRelPath: tilesetRelPathFromProject });
            }
        }));

        await Promise.all(tilemapData.rulesets.refs.map(rulesetRef => {
            if (this.rulesetManager.rulesetMetadata.has(rulesetRef.id)) {
                return this.rulesetManager.loadRuleset(rulesetRef.id)
            } else {
                const rulesetAbsPath = tilemapPathSystem.getAbsPathFromRelPath(rulesetRef.source);
                const rulesetRelPathFromProject = this.projectPathSystem.getRelPathFromAbsPath(rulesetAbsPath);
                return this.rulesetManager.loadRuleset(rulesetRelPathFromProject);
            }
        }));

        return Result.Success(tilemap);
    }

    public async unloadTilemap(tilemapId: string): Promise<void> {
        const tilemapMetadata = this.tilemapMetadata.get(tilemapId);
        if (!tilemapMetadata) return;

        const tilemap = this.loadedTilemaps.get(tilemapId);
        if (!tilemap) return;

        await tilemap.unload();
        this.loadedTilemaps.delete(tilemapId);
    }

    public async saveTilemap(id: string): Promise<Result> {
        const tilemap = this.loadedTilemaps.get(id);
        if (tilemap === undefined) return Result.Error("Tilemap not found")

        const tilemapData = tilemap.serialize();
        return TilemapStorageService.save(tilemap.tilemapPathSystem.getFileAbsPath(), tilemapData);
    }

    public async deleteTilemap(id: string): Promise<Result> {
        const metaData = this.tilemapMetadata.get(id);
        if (!metaData) return Result.Error(`Tilemap metadata not found for id: ${id}`);

        if (this.loadedTilemaps.has(id)) {
            await this.unloadTilemap(id);
        }

        const tilemapAbsPath = this.projectPathSystem.getAbsPathFromRelPath(metaData.tilemapRelPath);
        const removeResult = await TilemapStorageService.remove(tilemapAbsPath);
        if (removeResult.status !== Result.Status.Success) {
            return Result.Error(`Failed to delete tilemap file: ${removeResult.message}`);
        }

        this.tilemapMetadata.delete(id);

        return Result.Success();
    }

    public serialize(): TilemapMetadata[] {
        return Array.from(this.tilemapMetadata.values()).map((metaData) => {
            const tilemap = this.loadedTilemaps.get(metaData.id);
            if (!tilemap) return metaData;
            return { name: tilemap.name, id: tilemap.id, tilemapRelPath: tilemap.tilemapPathSystem.relPath };
        });
    }
}