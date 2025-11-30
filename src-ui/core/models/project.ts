import EventEmitter from "eventemitter3";

import { JsonTilemapStorageService } from "@/infrastructure/TilemapStorageService";
import { useProjectStore } from "@/view/stores/project/projectStore";
import { BaseDirectory } from "@tauri-apps/plugin-fs";

import { TilemapManager } from "../application/tilemapManager";
import { TilesetManager } from "../application/tilesetManager";
import { ProjectData, ProjectMetaData } from "../schema/projectSchema";

export class Project extends EventEmitter {
    public metaData: ProjectMetaData;
    public tilesetManager: TilesetManager;
    public tilemapManager: TilemapManager;

    constructor(data: ProjectData, directory: string) {
        super();
        this.metaData = {
            id: data.id,
            name: data.name,
            version: data.version,
            description: data.description,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            directory: directory,
        }

        this.tilesetManager = new TilesetManager();
        this.tilesetManager.addTilesetPaths(data.tilesetPaths);

        const tilemapStorageService = new JsonTilemapStorageService(BaseDirectory.AppData);
        this.tilemapManager = new TilemapManager(this.metaData.directory, this.tilesetManager, tilemapStorageService);
        this.tilemapManager.loadTilemapPaths(data.tilemapPaths);
        
    }

    public async load() {
        useProjectStore.getState().setCurrentProject(this.serialize());
        this.tilemapManager.getTilemaps().then((tilemaps) => {
            useProjectStore.getState().setTilemaps(tilemaps);
        })
        this.tilesetManager.getTilesets().then((tilesets) => {
            useProjectStore.getState().setTilesets(tilesets);
        })
    }

    public async unload() {
        // TODO: Unload tilemap and tileset
    }

    public serialize(): ProjectData {
        return {
            id: this.metaData.id,
            name: this.metaData.name,
            version: this.metaData.version,
            description: this.metaData.description,
            createdAt: this.metaData.createdAt,
            updatedAt: this.metaData.updatedAt,
            tilemapPaths: this.tilemapManager.getTilemapPaths(),
            tilesetPaths: this.tilesetManager.getTilemapPaths(),
        };
    }

    public addTilemap(tilemap: any) {
        // TODO: Add tilemap
    }

    public addTileset(tileset: any) {
        // TODO: Add tileset
    }
}