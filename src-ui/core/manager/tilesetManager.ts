import { TextureService } from "@/infrastructure/textureService";
import { ToastService } from "@/shared/services/toastService";
import { ErrorResult, Result, SuccessResult } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/pathUtils";

import { ITilesetStorageService } from "../../infrastructure/interface/ITilesetStorageService";
import { TilesetData, TilesetMetaData } from "../../shared/schema/tilesetSchema";
import { Tileset } from "../application/tile/tileset";

export class TilesetManager {
    private tilesetMap: Map<string, Tileset> = new Map<string, Tileset>(); // id -> tileset

    public constructor(
        private readonly tilesetStorageService: ITilesetStorageService,
        private tilesetsMetaData: TilesetMetaData[]
    ) { }

    public getTilesetsMetaData(): TilesetMetaData[] {
        return this.tilesetsMetaData.map((metaData) => {
            const tileset = this.tilesetMap.get(metaData.id);
            if (!tileset) return metaData;
            return { name: tileset.name, id: tileset.id, tilesetRelPath: metaData.tilesetRelPath };
        })
    }

    public async loadAll(): Promise<void> {
        await Promise.all(this.tilesetsMetaData.map(async (metaData) => {
            const loadTilesetResult = await this.tilesetStorageService.loadTileset(metaData.tilesetRelPath);
            if (loadTilesetResult.status === "Success") {
                const tilesetData = loadTilesetResult.data;

                const tilesetAbsPath = PathUtils.join(this.tilesetStorageService.projectDir, metaData.tilesetRelPath);
                const tilesetDir = PathUtils.dirname(tilesetAbsPath);
                const textureService = new TextureService(tilesetDir)

                const newTileset = new Tileset(tilesetData, textureService);
                await newTileset.loadTexture();
                this.tilesetMap.set(tilesetData.id, newTileset);

                await this.saveTileset(newTileset.id);
            } else if (loadTilesetResult.status === "Error") {
                ToastService.error({ message: loadTilesetResult.message });
            }
        }));
    }

    public async saveTileset(id: string): Promise<Result> {
        const tileset = this.tilesetMap.get(id);
        if (tileset == undefined) return ErrorResult("Tileset not found");
        const tilesetRelPath = this.tilesetsMetaData.find(metaData => metaData.id === id)?.tilesetRelPath;
        if (!tilesetRelPath) return ErrorResult("Tileset meta data not found");

        try {
            const tilesetData = tileset.serialize();
            await this.tilesetStorageService.saveTileset(tilesetRelPath, tilesetData);
            return SuccessResult();
        } catch (error) {
            return ErrorResult(`Failed to save tileset, error: ${error}`);
        }
    }

    public getTilesetById(id: string): Result<Tileset> {
        const tileset = this.tilesetMap.get(id);
        if (tileset === undefined) {
            return ErrorResult("Tileset not found");
        }
        return SuccessResult(tileset);
    }

    public getTilesetByRelPath(relPath: string): Result<Tileset> {
        const tilesetMetaData = this.tilesetsMetaData.find(metaData => metaData.tilesetRelPath === relPath);
        if (!tilesetMetaData) return ErrorResult("Tileset meta data not found");

        const tileset = this.tilesetMap.get(tilesetMetaData.id);
        if (tileset === undefined) return ErrorResult("Tileset not found");

        return SuccessResult(tileset);
    }

    public getAllTilesets(): Tileset[] {
        return Array.from(this.tilesetMap.values());
    }

    public getTilesetAbsById(id: string): Result<string> {
        const tilesetMetaData = this.tilesetsMetaData.find(metaData => metaData.id === id);
        if (!tilesetMetaData) return ErrorResult("Tileset meta data not found");
        const tilesetAbsPath = PathUtils.join(this.tilesetStorageService.projectDir, tilesetMetaData.tilesetRelPath);
        return SuccessResult(tilesetAbsPath);
    }

    public async createTileset(tilesetData: TilesetData, tilesetAbsPath: string): Promise<Result<Tileset>> {
        const tilesetDir = PathUtils.dirname(tilesetAbsPath);
        const textureService = new TextureService(tilesetDir)
        const newTileset = new Tileset(tilesetData, textureService)
        await newTileset.loadTexture();
        const tilesetRelPath = PathUtils.relative(this.tilesetStorageService.projectDir, tilesetAbsPath);
        this.tilesetsMetaData.push({ name: newTileset.name, id: newTileset.id, tilesetRelPath: tilesetRelPath });
        this.tilesetMap.set(newTileset.id, newTileset);
        const result = await this.saveTileset(newTileset.id);
        if (result.status === "Success") {
            return SuccessResult(newTileset);
        } else {
            this.tilesetsMetaData = this.tilesetsMetaData.filter(metaData => metaData.id !== newTileset.id);
            this.tilesetMap.delete(newTileset.id);
            return ErrorResult(result.message);
        }
    }
}