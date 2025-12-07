import { ToastService } from "@/shared/services/toastService";
import { Result } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/pathUtils";

import { ITilemapStorageService } from "../../infrastructure/interface/ITilemapStorageService";
import { TilemapData, TilemapMetaData } from "../../shared/schema/tilemapSchema";
import { Tilemap } from "../application/tilemap";
import { TilesetSelector } from "./tilemapSelector";
import { TilesetManager } from "./tilesetManager";

export class TilemapManager {
    private tilemapMap: Map<string, Tilemap> = new Map<string, Tilemap>(); // id -> tilemap

    public constructor(
        private readonly tilemapStorageService: ITilemapStorageService, 
        private readonly tilesetManager: TilesetManager,
        private tilemapsMetaData: TilemapMetaData[]
    ) { }

    public getTilemapsMetaData(): TilemapMetaData[] {
        return this.tilemapsMetaData.map((metaData) => {
            const tilemap = this.tilemapMap.get(metaData.id);
            if (!tilemap) return metaData;
            return { name: tilemap.name, id: tilemap.id, tilemapRelPath: metaData.tilemapRelPath };
        })
    }

    public async loadAll(): Promise<void> {
        await Promise.all(this.tilemapsMetaData.map(async (metaData) => {
            const loadTilemapResult = await this.tilemapStorageService.loadTilemap(metaData.tilemapRelPath);
            if (loadTilemapResult.status === "Success") {
                const tilemapData = loadTilemapResult.data;
                const tilemapAbsPath = PathUtils.join(this.tilemapStorageService.projectDir, metaData.tilemapRelPath);
                const tilesetSelector = new TilesetSelector(this.tilesetManager, this.tilemapStorageService.projectDir, tilemapAbsPath);
                const tilemap = new Tilemap(tilemapData, tilesetSelector);
                await tilemap.load();
                this.tilemapMap.set(tilemapData.id, tilemap);
            } else if (loadTilemapResult.status === "Error") {
                ToastService.error({ message: loadTilemapResult.message });
            }
        }));
    }

    public async saveTilemap(id: string): Promise<Result> {
        const tilemap = this.tilemapMap.get(id);
        if (tilemap === undefined) return { status: "Error", message: "Tilemap not found", data: null };

        const tilemapRelPath = this.tilemapsMetaData.find(metaData => metaData.id === id)?.tilemapRelPath;
        if (!tilemapRelPath) return { status: "Error", message: "Tilemap path not found", data: null };

        try {
            const tilemapData = tilemap.serialize();
            await this.tilemapStorageService.saveTilemap(tilemapRelPath, tilemapData);
            return { status: "Success", data: null };
        } catch (error) {
            return { status: "Error", message: `Failed to save tilemap, error: ${error}` };
        }
    }

    public async getAllTilemaps(): Promise<Tilemap[]> {
        return Array.from(this.tilemapMap.values());
    }

    public async createTilemap(tilemapData: TilemapData, tilemapAbsPath: string): Promise<Result> {
        const tilesetSelector = new TilesetSelector(this.tilesetManager, this.tilemapStorageService.projectDir, tilemapAbsPath);
        const newTilemap = new Tilemap(tilemapData, tilesetSelector);
        await newTilemap.load();
        const tilemapRelPath = PathUtils.relative(this.tilemapStorageService.projectDir, tilemapAbsPath);
        this.tilemapsMetaData.push({ name: newTilemap.name, id: newTilemap.id, tilemapRelPath: tilemapRelPath });
        this.tilemapMap.set(newTilemap.id, newTilemap);
        const result = await this.saveTilemap(newTilemap.id);
        if (result.status === "Success") {
            return { status: "Success", data: newTilemap };
        } else {
            return { status: "Error", message: result.message };
        }
    }
}