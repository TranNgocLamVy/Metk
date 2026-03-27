import { TextureService } from "@/infrastructure/textureService";
import { ToastService } from "@/shared/services/toastService";
import { Result } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/pathUtils";

import { TilesetData, TilesetMetaData } from "../../shared/schema/tilesetSchema";
import { Tileset } from "../application/tile/tileset";
import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/projectPathSystem";
import { TilesetStorageService } from "@/infrastructure/container";

export class TilesetManager {
    private tilesetMap: Map<string, Tileset> = new Map<string, Tileset>(); // id -> tileset

    public constructor(
        private readonly projectPathSystem: ProjectPathSystem,
    ) { }

    public getTilesetsMetaData(): TilesetMetaData[] {
        const tilesetArray = Array.from(this.tilesetMap.values());
        return tilesetArray.map((tileset) => ({ name: tileset.name, id: tileset.id, tilesetRelPath: tileset.tilesetPathSystem.relDir }));
    }

    public async loadAll(tilesetsMetaData: TilesetMetaData[]): Promise<void> {
        await Promise.all(tilesetsMetaData.map(async (metaData) => {
            const tilesetAbsPath = this.projectPathSystem.getAbsPathFromRelPath(metaData.tilesetRelPath);
            
            const loadTilesetResult = await TilesetStorageService.load(tilesetAbsPath);
            if (loadTilesetResult.status === Result.Status.Success) {
                const tilesetData = loadTilesetResult.data;
                
                const tilesetPathSystem = new FilePathSystem(metaData.id, this.projectPathSystem, metaData.tilesetRelPath);

                //TODO: Remove TextureService, tileset will load Texture into pixiJS textureManager
                const textureService = new TextureService(tilesetPathSystem.getFileAbsDir());

                const newTileset = new Tileset(tilesetData, textureService, tilesetPathSystem);
                await newTileset.loadTexture();
                this.tilesetMap.set(tilesetData.id, newTileset);

                await this.saveTileset(newTileset.id);
            } else if (loadTilesetResult.status === Result.Status.Error) {
                ToastService.error({ message: loadTilesetResult.message });
            }
        }));
    }

    public async saveTileset(id: string): Promise<Result> {
        const tileset = this.tilesetMap.get(id);
        if (tileset == undefined) return Result.Error("Tileset not found");

        try {
            const tilesetData = tileset.serialize();
            await TilesetStorageService.save(tileset.tilesetPathSystem.getFileAbsDir(), tilesetData);
            return Result.Success();
        } catch (error) {
            return Result.Error(`Failed to save tileset, error: ${error}`);
        }
    }

    public getTilesetById(id: string): Tileset | null {
        const tileset = this.tilesetMap.get(id);
        if (tileset === undefined) return null
        return tileset;
    }

    public getAllTilesets(): Tileset[] {
        return Array.from(this.tilesetMap.values());
    }

    public getTilesetAbsById(id: string): string | null {
        const tileset = this.tilesetMap.get(id);
        if (!tileset) return null;
        return tileset.tilesetPathSystem.getFileAbsPath();
    }

    public async createTileset(tilesetData: TilesetData, tilesetAbsPath: string): Promise<Result<Tileset>> {
        const tilesetDir = PathUtils.dirname(tilesetAbsPath);
        const textureService = new TextureService(tilesetDir)
        const tilesetPathSystem = new FilePathSystem(tilesetData.id, this.projectPathSystem, tilesetAbsPath);
        const newTileset = new Tileset(tilesetData, textureService, tilesetPathSystem);
        await newTileset.loadTexture();
        this.tilesetMap.set(newTileset.id, newTileset);
        const result = await this.saveTileset(newTileset.id);
        if (result.status === Result.Status.Success) {
            return Result.Success(newTileset);
        } else {
            this.tilesetMap.delete(newTileset.id);
            return Result.Error(result.message);
        }
    }
}