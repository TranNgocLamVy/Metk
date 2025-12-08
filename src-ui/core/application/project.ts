import EventEmitter from "eventemitter3";

import { JsonTilemapStorageService } from "@/infrastructure/tilemapStorageService";
import { JsonTilesetStorageService } from "@/infrastructure/tilesetStorageService";
import { TilemapData } from "@/shared/schema/tilemapSchema";
import { TilesetData } from "@/shared/schema/tilesetSchema";
import { ToastService } from "@/shared/services/toastService";
import { Result } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/pathUtils";

import { IProjectStorageService } from "../../infrastructure/interface/IProjectStorageService";
import { ProjectData, ProjectMetaData } from "../../shared/schema/projectSchema";
import { PROJECT_FILE_NAME } from "../constance/project";
import { TilemapManager } from "../manager/tilemapManager";
import { TilesetManager } from "../manager/tilesetManager";
import { Tilemap } from "./tilemap";
import { Tileset } from "./tileset";

export class Project {
    private _metaData: ProjectMetaData;
    public get metaData(): ProjectMetaData { return { ...this._metaData, updatedAt: new Date().toDateString() } }
    private set metaData(value: ProjectMetaData) { this._metaData = value }
    
    private projectStorageService: IProjectStorageService;
    public tilesetManager: TilesetManager;
    public tilemapManager: TilemapManager;

    constructor(data: ProjectData, directory: string, projectStorageService: IProjectStorageService) {
        this.metaData = {
            id: data.id,
            name: data.name,
            version: data.version,
            description: data.description,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            directory: directory,
        }

        this.projectStorageService = projectStorageService;

        const tilesetStorageService = new JsonTilesetStorageService(this.metaData.directory);
        this.tilesetManager = new TilesetManager(tilesetStorageService, data.tilesets);

        const tilemapStorageService = new JsonTilemapStorageService(this.metaData.directory);
        this.tilemapManager = new TilemapManager(tilemapStorageService, this.tilesetManager, data.tilemaps);
    }

    public async load() {
        await this.tilesetManager.loadAll();
        await this.tilemapManager.loadAll();
    }

    public async unload() {
        
    }

    public serialize(): ProjectData {
        return {
            id: this.metaData.id,
            name: this.metaData.name,
            version: this.metaData.version,
            description: this.metaData.description,
            createdAt: this.metaData.createdAt,
            updatedAt: new Date().toDateString(),
            tilemaps: this.tilemapManager.getTilemapsMetaData(),
            tilesets: this.tilesetManager.getTilesetsMetaData(),
        };
    }

    private async save(): Promise<void> {
        const projectData = this.serialize();
        const filePath = PathUtils.join(this.metaData.directory, PROJECT_FILE_NAME);
        const result = await this.projectStorageService.saveProject(filePath, projectData);
        if (result.status == "Error") {
            ToastService.error({ message: `Error while saving project: ${result.message}` });
        }
    }

    public async createTileset(tilesetData: TilesetData, tilesetAbsPath: string): Promise<Result<Tileset>> {
        const result = await this.tilesetManager.createTileset(tilesetData, tilesetAbsPath);
        if (result.status === "Success") {
            this.save();
        }
        return result;
    }

    public async createTilemap(tilemapData: TilemapData, tilemapAbsPath: string): Promise<Result<Tilemap>> {
        const result = await this.tilemapManager.createTilemap(tilemapData, tilemapAbsPath);
        if (result.status === "Success") {
            this.save();
        }
        return result;
    }
}