import { Result } from "@/shared/types/result";

import { Tileset } from "@/editor/model/tileset/tileset";
import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/projectPathSystem";
import { TilesetStorageService } from "@/infrastructure/container";
import { PathUtils } from "@/shared/utils/path.utils";
import { Console } from "@/shared/services/console.service";
import { TilesetData, TilesetMetadata } from "@/shared/schema/tileset.schema";
import { CatchError } from "@/shared/decorator/catch-result-error.decorator";

export class TilesetManager {
    public readonly tilesetMetadata: Map<string, TilesetMetadata> = new Map<string, TilesetMetadata>(); // id -> tilesetMetadata
    private loadedTilesets: Map<string, Tileset> = new Map<string, Tileset>(); // id -> tileset

    private pendingLoads: Map<string, Promise<Result<Tileset>>> = new Map(); // tilesetId -> loadTileset Promise

    public constructor(
        private readonly projectPathSystem: ProjectPathSystem,
    ) { }

    public addTilesetMetadata(tilesetMetadata: TilesetMetadata): void {
        this.tilesetMetadata.set(tilesetMetadata.id, tilesetMetadata);
    }

    public async addTileset(tileset: TilesetData, tilesetAbsPath: string): Promise<Result<Tileset>> {
        const tilesetRelPath = PathUtils.relative(this.projectPathSystem.absDir, tilesetAbsPath);
        const tilesetMetadata: TilesetMetadata = {
            id: tileset.id,
            name: tileset.name,
            tilesetRelPath: tilesetRelPath,
        }
        this.tilesetMetadata.set(tileset.id, tilesetMetadata);
        const tilesetPathSystem = new FilePathSystem(tileset.id, this.projectPathSystem, tilesetRelPath);
        const newTileset = new Tileset(tileset, tilesetPathSystem);

        await newTileset.load();

        this.loadedTilesets.set(tileset.id, newTileset);

        return Result.Success(newTileset);
    }

    public loadTilesetsMetadata(tilesetsMetadata: TilesetMetadata[]): void {
        tilesetsMetadata.forEach((meta) => this.tilesetMetadata.set(meta.id, meta));
    }
    
    public async loadTilesets(ids: string[]): Promise<Result<Tileset>[]> {
        return await Promise.all(ids.map(id => this.loadTileset(id)));
    }
    
    @CatchError("message.system.unknownError.loadTileset")
    public async loadTileset(id: string): Promise<Result<Tileset>> {
        if (this.loadedTilesets.has(id)) return Result.Success(this.loadedTilesets.get(id)!);
        if (this.pendingLoads.has(id)) return this.pendingLoads.get(id)!;

        const loadPromise = this.performTilesetLoad(id);
        this.pendingLoads.set(id, loadPromise);

        try {
            return await loadPromise;
        } finally {
            this.pendingLoads.delete(id);
        }
    }

    private async performTilesetLoad(id: string): Promise<Result<Tileset>> {
        const tilesetMetadata = this.tilesetMetadata.get(id);
        if (!tilesetMetadata) {
            const customId = "loadTilesetFail:" + id;
            Console.error({
                message: { key: "message.tileset.loadFail", options: { name: "Unknow", id } },
                stacks: ["message.tileset.metadataNotFound"],
                actions: [{
                    label: "global.action.tileset.import", variant: "outline",
                    onClick: async () => {
                        const { TilesetService } = await import("@/shared/services/tileset.service");
                        return await TilesetService.importTileset(id);
                    }
                }]
            }, customId);
            return Result.Error("message.tileset.metadataNotFound");
        }

        const tilesetAbsPath = this.projectPathSystem.getAbsPathFromRelPath(tilesetMetadata.tilesetRelPath);

        const loadTilesetResult = await TilesetStorageService.load(tilesetAbsPath);
        if (loadTilesetResult.status !== Result.Status.Success) {
            const customId = "loadTilesetFail:" + id;
            Console.error({
                message: { key: "message.tileset.loadFail", options: { name: tilesetMetadata.name, id } },
                stacks: loadTilesetResult.message ? [loadTilesetResult.message] : [],
                actions: [
                    {
                        label: "global.action.tileset.import", variant: "outline",
                        onClick: async () => {
                            const { TilesetService } = await import("@/shared/services/tileset.service");
                            return await TilesetService.importTileset(id);
                        }
                    },
                    {
                        label: "global.action.tileset.remove", variant: "destructive",
                        onClick: async () => {
                            const { TilesetService } = await import("@/shared/services/tileset.service");
                            return await TilesetService.removeTileset(id);
                        }
                    },
                ]
            }, customId)
            return Result.Error(loadTilesetResult.message);
        }

        return await this.addTileset(loadTilesetResult.data, tilesetAbsPath);
    }

    public async unloadTileset(id: string): Promise<void> {
        const tileset = this.loadedTilesets.get(id);
        if (!tileset) return;
        await tileset.unload();
        this.loadedTilesets.delete(id);
    }

    public async saveTileset(id: string): Promise<Result> {
        const tileset = this.loadedTilesets.get(id);
        if (tileset == undefined) return Result.Error({ key: "message.tileset.notFound", options: { id } });
        const tilesetData = tileset.serialize();
        return TilesetStorageService.save(tileset.tilesetPathSystem.getFileAbsPath(), tilesetData);
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

    public updateTileset(tilesetData: TilesetData): void {
        // TODO: Implement
    }

    public async removeTileset(id: string): Promise<Result> {
        const tilesetMetadata = this.tilesetMetadata.get(id);
        if (!tilesetMetadata) return Result.Error({ key: "message.tileset.metadataNotFound", options: { id } });

        if (this.loadedTilesets.has(id)) await this.unloadTileset(id);

        this.tilesetMetadata.delete(id);
        Console.log({ message: { key: "message.tileset.removeSuccess", options: { name: tilesetMetadata.name } } });
        return Result.Success();
    }

    public async deleteTileset(id: string): Promise<Result> {
        const tilesetMetadata = this.tilesetMetadata.get(id);
        if (!tilesetMetadata) {
            Console.error({
                message: "message.tileset.deleteFail",
                stacks: ["message.tileset.metadataNotFound"],
            })
            return Result.Error({ key: "message.tileset.metadataNotFound", options: { id } });
        }

        if (this.loadedTilesets.has(id)) await this.unloadTileset(id);

        const tilesetAbsPath = this.projectPathSystem.getAbsPathFromRelPath(tilesetMetadata.tilesetRelPath);

        const deletionResult = await TilesetStorageService.remove(tilesetAbsPath);
        if (deletionResult.status !== Result.Status.Success) {
            Console.error({ message: "message.tileset.deleteFail", stacks: [deletionResult.message!, ...deletionResult.stacks!] })
            return Result.Error("message.tileset.deleteFail", deletionResult);
        }
        this.tilesetMetadata.delete(id);
        this.loadedTilesets.delete(id);
        this.pendingLoads.delete(id);

        Console.log({ message: { key: "message.tileset.deleteSuccess", options: { name: tilesetMetadata.name } } });
        return Result.Success();
    }

    public cloneTileset(id: string): Tileset | null {
        // TODO: Implement
        return null;
    }

    public serialize(): TilesetMetadata[] {
        return Array.from(this.tilesetMetadata.values()).map((tilesetMetadata) => {
            const tileset = this.loadedTilesets.get(tilesetMetadata.id);
            if (!tileset) return tilesetMetadata;
            return { name: tileset.name, id: tileset.id, tilesetRelPath: tileset.tilesetPathSystem.relPath };
        });
    }
}