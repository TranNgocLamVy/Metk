
import { TilemapData } from "@/shared/schema/tilemapSchema";
import { TilesetData } from "@/shared/schema/tilesetSchema";
import { ToastService } from "@/shared/services/toastService";
import { Result } from "@/shared/types/result";

import { ProjectData, ProjectMetaData } from "../../shared/schema/projectSchema";
import { TilemapManager } from "../manager/tilemapManager";
import { TilesetManager } from "../manager/tilesetManager";
import { Tilemap } from "./tile/tilemap";
import { Tileset } from "./tile/tileset";
import { ProjectPathSystem } from "@/infrastructure/projectPathSystem";
import { ProjectStorageService } from "@/infrastructure/container";

export class Project {
    public readonly id: string;
    public name: string;
    public version: string;
    public description: string;
    public createdAt: string;
    public updatedAt: string;

    public get metaData(): ProjectMetaData {
        return {
            id: this.id,
            name: this.name,
            version: this.version,
            description: this.description,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            directory: this.projectPathSystem.projectDir,
        }
    }
    
    public tilesetManager: TilesetManager;
    public tilemapManager: TilemapManager;

    constructor(private data: ProjectData, public readonly projectPathSystem: ProjectPathSystem) {
        this.id = data.id;
        this.name = data.name;
        this.version = data.version;
        this.description = data.description;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;

        this.tilesetManager = new TilesetManager(this.projectPathSystem);

        this.tilemapManager = new TilemapManager(this.tilesetManager, this.projectPathSystem);
    }

    public async load() {
        await this.tilesetManager.loadAll(this.data.tilesets);
        await this.tilemapManager.loadAll(this.data.tilemaps);
    }

    public async unload() {
        
    }

    public serialize(): ProjectData {
        return {
            id: this.id,
            name: this.name,
            version: this.version,
            description: this.description,
            createdAt: this.createdAt,
            updatedAt: new Date().toDateString(),
            tilemaps: this.tilemapManager.getTilemapsMetaData(),
            tilesets: this.tilesetManager.getTilesetsMetaData(),
        };
    }

    private async save(): Promise<void> {
        const projectData = this.serialize();
        const result = await ProjectStorageService.save(this.projectPathSystem.getAbsPathFromRelPath("project.json"), projectData);
        if (result.status === Result.Status.Error) {
            ToastService.error({ message: `Error while saving project: ${result.message}` });
        }
    }

    public async createTileset(tilesetData: TilesetData, tilesetAbsPath: string): Promise<Result<Tileset>> {
        const result = await this.tilesetManager.createTileset(tilesetData, tilesetAbsPath);
        if (result.status === Result.Status.Success) {
            this.save();
        }
        return result;
    }

    public async createTilemap(tilemapData: TilemapData, tilemapAbsPath: string): Promise<Result<Tilemap>> {
        const result = await this.tilemapManager.createTilemap(tilemapData, tilemapAbsPath);
        if (result.status === Result.Status.Success) {
            this.save();
        }
        return result;
    }
}