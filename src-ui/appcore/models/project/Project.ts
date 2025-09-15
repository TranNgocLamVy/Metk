import EventEmitter from "eventemitter3";
import { v4 as uuidv4 } from "uuid";

import { DefaultTilemap } from "@/appcore/default/tile/defaultTilemap";
import { DefaultTileset } from "@/appcore/default/tile/defaultTileset";
import { DialogService } from "@/appcore/services/DialogService";
import { exists } from "@tauri-apps/plugin-fs";

import { ProjectData, ProjectMetaData } from "../../schemas/projectSchema";
import { ProjectStorageService } from "../../services/ProjectStorageService";
import { TilemapManager } from "../manager/TilemapManager";
import { TilesetManager } from "../manager/TilesetManager";

export class Project extends EventEmitter {
    public readonly id: string;
    public directory: string;
    public name: string;
    public version: string;
    public description: string;
    public createdAt: string;
    public updatedAt: string;
    public tilemapPaths: string[] = []
    public tilesetPaths: string[] = []

    public tilesetManager: TilesetManager = new TilesetManager();
    public tilemapManager: TilemapManager = new TilemapManager();

    constructor(data: ProjectData & { directory: string }) {
        super();
        this.id = data.id;
        this.directory = data.directory;
        this.name = data.name;
        this.version = data.version;
        this.description = data.description;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
        this.tilemapPaths = data.tilemapPaths;
        this.tilesetPaths = data.tilesetPaths;
    }

    public async load() {
        await this.loadTilesets();
        await this.loadTilemaps();
    }

    private async loadTilesets() {
        await Promise.all(this.tilesetPaths.map(async (path) => {
            const tileset = await DefaultTileset.loadTileset(path);
            if (!tileset) return;
            this.tilesetManager.loadTileset(path, tileset);
        }))
    }

    private async loadTilemaps() {
        await Promise.all(this.tilemapPaths.map(async (path) => {
            const tilemap = await DefaultTilemap.loadTilemap(path, {tilesetManager: this.tilesetManager});
            if (!tilemap) return;
            this.tilemapManager.loadTilemap(path, tilemap);
        }))
    }

    public async save() {
        const projectData = this.serialize();
        await ProjectStorageService.saveProject(projectData, this.directory);
    }

    public async unload() {
        // TODO: Unload tilemap and tileset
    }

    public serialize(): ProjectData {
        return {
            id: this.id,
            name: this.name,
            version: this.version,
            description: this.description,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            tilemapPaths: [],
            tilesetPaths: []
        };
    }

    public addTilemap(tilemap: any) {
        // TODO: Add tilemap
    }

    public addTileset(tileset: any) {

    }

    static async createProject(): Promise<ProjectMetaData | null> {
        const form = await DialogService.openFormDialog({
            title: "Create new Project",
            okText: "Create",
            cancelText: "Cancel",
            inputs: [
                {
                    id: "name",
                    name: "name",
                    type: "text",
                    label: "Project Name",
                    placeholder: "Your Tile Project",
                    required: true,
                },
                {
                    id: "destination",
                    name: "destination",
                    type: "folderPath",
                    label: "Destination",
                    placeholder: "Select a folder",
                    required: true,
                }
            ],
            async validateBeforeSubmit(values) {
                const path = values.destination + "\\" + values.name;
                const isExists = await exists(path);

                if (isExists) {
                    return { valid: false, message: `Folder with name "${values.name}" already exists at "${values.destination}"` }
                }

                return { valid: true }
            },
        })
        if (!form) return null;

        const fullDirectory = form.destination + "\\" + form.name;

        const project = new Project({
            id: uuidv4(),
            directory: fullDirectory,
            name: form.name,
            version: "0.1.0",
            description: "",
            createdAt: new Date().toDateString(),
            updatedAt: new Date().toDateString(),
            tilemapPaths: [],
            tilesetPaths: [],
        });

        await ProjectStorageService.createProject(project.serialize(), fullDirectory);

        return {
            id: project.id,
            name: project.name,
            version: project.version,
            description: project.description,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
            directory: fullDirectory,
        }
    }
}