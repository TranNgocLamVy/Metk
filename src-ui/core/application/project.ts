import EventEmitter from "eventemitter3";

import { JsonTilemapStorageService } from "@/infrastructure/tilemapStorageService";
import { JsonTilesetStorageService } from "@/infrastructure/tilesetStorageService";
import { TilesetData } from "@/shared/schema/tilesetSchema";
import { Result } from "@/shared/types/result";
import { PathUtils } from "@/shared/utils/pathUtils";

import { ProjectData, ProjectMetaData } from "../../shared/schema/projectSchema";
import { PROJECT_FILE_NAME } from "../constance/project";
import { Tileset } from "../domain/tileset";
import { IProjectStorageService } from "../interface/IProjectStorageService";
import { TilemapManager } from "./tilemapManager";
import { TilesetManager } from "./tilesetManager";

export class Project {
    public metaData: ProjectMetaData;
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

        const tilemapStorageService = new JsonTilemapStorageService();
        this.tilemapManager = new TilemapManager(this.metaData.directory, this.tilesetManager, tilemapStorageService);
    }

    public async load() {
        await this.tilesetManager.loadAll();
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
            updatedAt: this.metaData.updatedAt,
            tilemaps: [],
            tilesets: this.tilesetManager.gettilesetsMetaData(),
        };
    }

    private async save(): Promise<void> {
        const projectData = this.serialize();
        const filePath = PathUtils.join(this.metaData.directory, PROJECT_FILE_NAME);
        await this.projectStorageService.saveProject(filePath, projectData);
    }

    public async createTileset(tilesetData: TilesetData, tilesetAbsPath: string): Promise<Result<Tileset>> {
        const result = await this.tilesetManager.createTileset(tilesetData, tilesetAbsPath);
        if (result.status === "Success") {
            this.save();
        }
        return result;
    }
}