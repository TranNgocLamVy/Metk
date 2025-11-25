import EventEmitter from "eventemitter3";

import { useProjectStore } from "@/view/stores/project/projectStore";

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
        this.tilemapManager = new TilemapManager(this.tilesetManager);

        this.tilemapManager.addTilemapPaths(data.tilemapPaths);
        this.tilesetManager.addTilesetPaths(data.tilesetPaths);
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