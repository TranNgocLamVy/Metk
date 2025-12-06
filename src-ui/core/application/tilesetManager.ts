import { Tileset } from "@/core/domain/tileset";
import { TextureService } from "@/infrastructure/textureService";
import { ToastService } from "@/shared/services/toastService";
import { Result } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/pathUtils";

import { TilesetData, TilesetMetaData } from "../../shared/schema/tilesetSchema";
import { ITilesetStorageService } from "../interface/ITilesetStorageService";

export class TilesetManager {
    private tilesetMap: Map<string, Tileset> = new Map<string, Tileset>(); // id -> tileset

    public constructor(
        private readonly tilesetStorageService: ITilesetStorageService,
        private tilesetsMetaData: TilesetMetaData[] = []
    ) { }

    public gettilesetsMetaData(): TilesetMetaData[] {
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
                this.tilesetsMetaData.push(metaData);
                await this.saveTileset(newTileset.id);
            } else if (loadTilesetResult.status === "Error") {
                ToastService.error({ message: loadTilesetResult.message });
            }
        }));
    }

    public async saveTileset(id: string): Promise<Result> {
        const tileset = this.tilesetMap.get(id);
        if (tileset == null) return { status: "Error", message: "Tileset not loaded" };
        if (tileset == undefined) return { status: "Error", message: "Tileset not found" };

        const tilesetRelPath = this.tilesetsMetaData.find(metaData => metaData.id === id)?.tilesetRelPath;
        if (!tilesetRelPath) return { status: "Error", message: "Tileset path not found" };

        try {
            const tilesetData = tileset.serialize();
            await this.tilesetStorageService.saveTileset(tilesetRelPath, tilesetData);
            return { status: "Success", data: null };
        } catch (error) {
            return { status: "Error", message: `Failed to save tileset, error: ${error}` };
        }
    }

    public async getTileset(id: string): Promise<Tileset | null> {
        const tileset = this.tilesetMap.get(id);
        if (tileset === undefined) return null;
        return tileset;
    }

    public async getAllTilesets(): Promise<Tileset[]> {
        return Array.from(this.tilesetMap.values());
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
            return { status: "Success", data: newTileset };
        } else {
            return { status: "Error", message: result.message };
        }
    }
}