import { Result } from "@/shared/types/result";

import { Tilemap } from "@/editor/model/tilemap/tilemap";
import { TilesetManager } from "../tileset/tileset.manager";
import { TilesetRefManager } from "../references/tileset-ref.manager";
import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/project-path-system";
import { TilemapStorageService } from "@/infrastructure/container";
import { RulesetRefManager } from "../references/ruleset-ref.manager";
import { RulesetManager } from "../ruleset/ruleset.manager";
import { Console } from "@/shared/services/console.service";
import { PathUtils } from "@/shared/utils/path.utils";
import { TilemapData, TilemapMetadata } from "@/shared/data-types/tilemap.data";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { normalizeTilemapData } from "@/editor/model/tilemap/tilemap.normalizer";
import { relative } from "pathe";

export class TilemapManager {
    public readonly tilemapMetadata: Map<string, TilemapMetadata> = new Map<string, TilemapMetadata>(); // id -> tilemapMetadata
    private loadedTilemaps: Map<string, Tilemap> = new Map<string, Tilemap>(); // id -> tilemap

    private pendingLoads: Map<string, Promise<Result<Tilemap>>> = new Map(); // tilemapId -> loadTilemap Promise

    public constructor(
        private readonly tilesetManager: TilesetManager,
        private readonly rulesetManager: RulesetManager,
        private readonly projectPathSystem: ProjectPathSystem,
        private readonly objectRegistry: EditorObjectRegistry,
    ) { }

    public addTilemapMetadata(tilemapMetadata: TilemapMetadata): void {
        this.tilemapMetadata.set(tilemapMetadata.id, tilemapMetadata);
    }

    public async addTilemap(tilemap: unknown, tilemapAbsPath: string): Promise<Result<Tilemap>> {
        let tilemapData: TilemapData;
        try {
            tilemapData = normalizeTilemapData(tilemap);
        } catch (error) {
            return Result.Error(`Failed to create tilemap: ${String(error)}`);
        }
        const tilemapRelPath = this.projectPathSystem.getRelPathFromAbsPath(tilemapAbsPath);
        const tilemapPathSystem = new FilePathSystem(tilemapData.id, this.projectPathSystem, tilemapRelPath);
        const tilesetRefManager = new TilesetRefManager(this.tilesetManager, tilemapPathSystem);
        const rulesetRefManager = new RulesetRefManager(this.rulesetManager, tilemapPathSystem);
        const newTilemap = new Tilemap(tilemapData, tilemapPathSystem, tilesetRefManager, rulesetRefManager);

        const tilemapMetadata: TilemapMetadata = {
            id: newTilemap.id,
            name: newTilemap.name,
            tilemapRelPath: tilemapRelPath,
        }
        this.tilemapMetadata.set(newTilemap.id, tilemapMetadata);

        this.objectRegistry.registerTree(newTilemap);

        this.loadedTilemaps.set(newTilemap.id, newTilemap);

        const tilesetDepIds = newTilemap.tilesetRefManager.getRefIds();
        const rulesetDepIds = newTilemap.rulesetRefManager.getRefIds();

        await Promise.all([
            this.tilesetManager.loadTilesets(tilesetDepIds),
            this.rulesetManager.loadRulesets(rulesetDepIds),
        ])

        return Result.Success(newTilemap);
    }

    public loadTilemapsMetadata(tilemapsMetadata: TilemapMetadata[]): void {
        tilemapsMetadata.forEach((meta) => this.tilemapMetadata.set(meta.id, meta));
    }

    public async loadTilemap(id: string): Promise<Result<Tilemap>> {
        if (this.loadedTilemaps.has(id)) return Result.Success(this.loadedTilemaps.get(id)!)
        if (this.pendingLoads.has(id)) return this.pendingLoads.get(id)!;

        const loadPromise = this.performTilemapLoad(id);
        this.pendingLoads.set(id, loadPromise);

        try {
            return await loadPromise;
        } finally {
            this.pendingLoads.delete(id);
        }
    }

    private async performTilemapLoad(id: string): Promise<Result<Tilemap>> {
        const tilemapMetadata = this.tilemapMetadata.get(id);
        if (!tilemapMetadata) {
            const customId = "loadTilemapFail:" + id;
            Console.error({
                message: { key: "message.tilemap.loadFail", options: { name: "Unknow", id } },
                stacks: [{ key: "message.tilemap.metadataNotFound", options: { id } }],
                actions: [{
                    label: "global.action.tilemap.import", variant: "outline",
                    onClick: async () => {
                        const { TilemapService } = await import("@/shared/services/tilemap.service");
                        return await TilemapService.importTilemap(id)
                    }
                }]
            }, customId);
            return Result.Error("message.tilemap.metadataNotFound");
        }

        const tilemapAbsPath = this.projectPathSystem.getAbsPathFromRelPath(tilemapMetadata.tilemapRelPath);
        const loadTilemapResult = await TilemapStorageService.load(tilemapAbsPath);

        if (loadTilemapResult.status !== Result.Status.Success) {
            const customId = "loadTilemapFail:" + id;
            Console.error({
                message: { key: "message.tilemap.loadFail", options: { name: tilemapMetadata.name, id } },
                stacks: loadTilemapResult.message ? [loadTilemapResult.message] : [],
                actions: [
                    {
                        label: "global.action.tilemap.import", variant: "outline",
                        onClick: async () => {
                            const { TilemapService } = await import("@/shared/services/tilemap.service");
                            return await TilemapService.importTilemap(id);
                        }
                    },
                    {
                        label: "global.action.tilemap.remove", variant: "destructive",
                        onClick: async () => {
                            const { TilemapService } = await import("@/shared/services/tilemap.service");
                            return await TilemapService.removeTilemap(id);
                        }
                    },
                ]
            }, customId);
            return Result.Error(loadTilemapResult.message);
        }

        return await this.addTilemap(loadTilemapResult.data, tilemapAbsPath);
    }

    public async unloadTilemap(tilemapId: string): Promise<void> {
        const tilemapMetadata = this.tilemapMetadata.get(tilemapId);
        if (!tilemapMetadata) return;

        const tilemap = this.loadedTilemaps.get(tilemapId);
        if (!tilemap) return;

        this.objectRegistry?.unregisterTree(tilemap);
        tilemap.destroy();

        this.loadedTilemaps.delete(tilemapId);
    }

    public async saveTilemap(id: string): Promise<Result> {
        const tilemap = this.loadedTilemaps.get(id);
        if (tilemap === undefined) return Result.Error("message.tilemap.notFound");

        const tilemapData = tilemap.serialize();
        return TilemapStorageService.save(tilemap.tilemapPathSystem.getFileAbsPath(), tilemapData);
    }

    public async removeTilemapMetadata(id: string): Promise<Result> {
        const tilemapMetadata = this.tilemapMetadata.get(id);
        if (!tilemapMetadata) return Result.Error({ key: "message.tilemap.metadataNotFound", options: { id } });

        if (this.loadedTilemaps.has(id)) {
            await this.unloadTilemap(id);
        }

        this.tilemapMetadata.delete(id);
        Console.log({ message: { key: "message.tilemap.removeSuccess", options: { name: tilemapMetadata.name } } });
        return Result.Success();
    }

    public async deleteTilemap(id: string): Promise<Result> {
        const tilemapMetadata = this.tilemapMetadata.get(id);
        if (!tilemapMetadata) {
            Console.error({
                message: "message.tilemap.deleteFail",
                stacks: ["message.tilemap.metadataNotFound"],
            })
            return Result.Error({ key: "message.tilemap.metadataNotFound", options: { id } });
        }

        if (this.loadedTilemaps.has(id)) {
            await this.unloadTilemap(id);
        }

        const tilemapAbsPath = this.projectPathSystem.getAbsPathFromRelPath(tilemapMetadata.tilemapRelPath);
        const removeResult = await TilemapStorageService.remove(tilemapAbsPath);
        if (removeResult.status !== Result.Status.Success) {
            Console.error({ message: "message.tilemap.deleteFail", stacks: [removeResult.message!, ...removeResult.stacks!] })
            return Result.Error("message.tilemap.deleteFail", removeResult);
        }

        this.tilemapMetadata.delete(id);
        Console.log({ message: { key: "message.tilemap.deleteSuccess", options: { name: tilemapMetadata.name } } });
        return Result.Success();
    }

    public async removeTilesetRef(tilesetId: string) {
        for (const tilemap of this.loadedTilemaps.values()) {
            const result = tilemap.removeTilesetRef(tilesetId);
            if (result) await this.saveTilemap(tilemap.id);
        }
    }

    public async removeRulesetRef(rulesetId: string) {
        for (const tilemap of this.loadedTilemaps.values()) {
            const result = tilemap.removeRulesetRef(rulesetId);
            if (result) await this.saveTilemap(tilemap.id);
        }
    }

    public serialize(): TilemapMetadata[] {
        return Array.from(this.tilemapMetadata.values()).map((metaData) => {
            const tilemap = this.loadedTilemaps.get(metaData.id);
            if (!tilemap) return metaData;
            return { name: tilemap.name, id: tilemap.id, tilemapRelPath: tilemap.tilemapPathSystem.relPath };
        });
    }

    public async destroy(): Promise<void> {
        for (const tilemap of this.loadedTilemaps.values()) {
            this.objectRegistry?.unregisterTree(tilemap);
            tilemap.destroy();
        }

        this.loadedTilemaps.clear();
        this.pendingLoads.clear();
    }
}
