import { ToastService } from "@/shared/services/toastService";
import { Result } from "@/shared/types/result";

import { TilemapData, TilemapMetadata } from "../../shared/schema/tilemapSchema";
import { Tilemap } from "../application/tile/tilemap";
import { TilesetManager } from "./tilesetManager";
import { TilesetRefManager } from "./tilesetRefManager";
import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/projectPathSystem";
import { TilemapStorageService } from "@/infrastructure/container";
import { RulesetRefManager } from "./rulesetRefManager";
import { RulesetManager } from "./rulesetManager";
import { Console } from "@/shared/services/consoleService";
import { PathUtils } from "@/shared/utils/pathUtils";
import { TilemapService } from "@/shared/services/tilemapService";
import i18n from "../service/i18n";

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

    public async addTilemap(tilemap: TilemapData, tilemapAbsPath: string): Promise<void> {
        const tilemapRelPath = PathUtils.relative(this.projectPathSystem.absDir, tilemapAbsPath);
        const tilemapMetadata: TilemapMetadata = {
            id: tilemap.id,
            name: tilemap.name,
            tilemapRelPath: tilemapRelPath,
        }
        this.tilemapMetadata.set(tilemap.id, tilemapMetadata);
        const tilemapPathSystem = new FilePathSystem(tilemap.id, this.projectPathSystem, tilemapRelPath);
        const tilesetRefManager = new TilesetRefManager(this.tilesetManager, tilemapPathSystem);
        const rulesetRefManager = new RulesetRefManager(this.rulesetManager, tilemapPathSystem);
        const newTilemap = new Tilemap(tilemap, tilesetRefManager, rulesetRefManager);
        await newTilemap.load();

        this.loadedTilemaps.set(tilemap.id, newTilemap);

        await this.loadTilemapDependencies(tilemap);
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
            const result = await loadPromise;
            return result;
        } catch (error) {
            console.error({ message: "Failed to load tilemap" }, error);
            return Result.Error(`Failed to load tilemap, error: ${error}`);
        } finally {
            this.pendingLoads.delete(id);
        }
    }

    private async performTilemapLoad(id: string): Promise<Result<Tilemap>> {
        const tilemapMetadata = this.tilemapMetadata.get(id);
        if (!tilemapMetadata) {
            // TODO: i18n
            Console.error({ 
                message: "message.tilemap.loadFail",
                stacks: ["message.tilemap.metadataNotFound"],
                actions: [{ label: "global.action.tilemap.import", onClick: () => TilemapService.importTilemap(id), variant: "outline" }]
            });
            return Result.Error("message.tilemap.metadataNotFound");
        }

        const tilemapAbsPath = this.projectPathSystem.getAbsPathFromRelPath(tilemapMetadata.tilemapRelPath);
        const loadTilemapResult = await TilemapStorageService.load(tilemapAbsPath);

        if (loadTilemapResult.status !== Result.Status.Success) {
            // TODO: i18n
            Console.error({ 
                message:  `${i18n.t("message.tilemap.loadFail")}: ${tilemapMetadata.name}`,
                stacks: loadTilemapResult.message ? [loadTilemapResult.message] : [],
                actions: [
                    { label: "global.action.tilemap.import", onClick: () => TilemapService.importTilemap(id), variant: "outline"},
                    { label: "global.action.tilemap.remove", onClick: () => TilemapService.removeTilemap(id), variant: "destructive" },
                ]
            });
            return Result.Error(loadTilemapResult.message);
        }

        const tilemapData = loadTilemapResult.data;

        const tilemapPathSystem = new FilePathSystem(tilemapMetadata.id, this.projectPathSystem, tilemapMetadata.tilemapRelPath);
        const tilesetRefManager = new TilesetRefManager(this.tilesetManager, tilemapPathSystem);
        const rulesetRefManager = new RulesetRefManager(this.rulesetManager, tilemapPathSystem);
        const tilemap = new Tilemap(tilemapData, tilesetRefManager, rulesetRefManager);

        await tilemap.load();

        this.loadedTilemaps.set(tilemapData.id, tilemap);
        
        await this.loadTilemapDependencies(tilemapData);

        return Result.Success(tilemap);
    }

    private async loadTilemapDependencies(tilemapData: TilemapData): Promise<void> {
        await Promise.all(tilemapData.tilesets.refs.map(tilesetRef => {
            if (this.tilesetManager.tilesetMetadata.has(tilesetRef.id)) {
                return this.tilesetManager.loadTileset({ id: tilesetRef.id })
            }
            // TODO: Handle unknown tileset
        }));

        await Promise.all(tilemapData.rulesets.refs.map(rulesetRef => {
            if (this.rulesetManager.rulesetMetadatas.has(rulesetRef.id)) {
                return this.rulesetManager.loadRuleset(rulesetRef.id)
            }
            // TODO: Handle unknown ruleset
        }));
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
        if (tilemap === undefined) return Result.Error("message.tilemap.notFound");

        const tilemapData = tilemap.serialize();
        return TilemapStorageService.save(tilemap.tilemapPathSystem.getFileAbsPath(), tilemapData);
    }

    public async removeTilemapMetadata(id: string): Promise<Result> {
        const metaData = this.tilemapMetadata.get(id);
        if (!metaData) return Result.Error(`Tilemap metadata not found for id: ${id}`);

        if (this.loadedTilemaps.has(id)) {
            await this.unloadTilemap(id);
        }

        this.tilemapMetadata.delete(id);
        return Result.Success();
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