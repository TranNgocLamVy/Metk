import { type } from "arktype";
import EventEmitter from "eventemitter3";
import { v4 as uuidv4 } from "uuid";

import { DialogService } from "@/appcore/services/DialogService";

export const ProjectDataParser = type({
    id: "string",
    directory: "string",
    name: "string",
    version: "string = '0.1.0'",
    description: "string = ''",
    createdAt: "Date",
    updatedAt: "Date",
    tilemapPath: "string[]",
    tilesetPath: "string[]",
})

export type ProjectFileData = typeof ProjectDataParser.infer;

export class Project extends EventEmitter {
    public readonly id: string;
    public directory: string;
    public name: string;
    public version: string;
    public description: string;
    public createdAt: Date;
    public updatedAt: Date;
    public tilemap: any[]; // TODO: Tilemap
    public tileset: any[]; // TODO: Tileset

    private constructor(data: ProjectFileData) {
        super();
        this.id = data.id;
        this.directory = data.directory;
        this.name = data.name;
        this.version = data.version;
        this.description = data.description;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;

        this.tilemap = [];
        data.tilemapPath.forEach((path) => {
            // TODO: Load tilemap
        });

        this.tileset = [];
        data.tilesetPath.forEach((path) => {
            // TODO: Load tileset
        });
    }

    public serialize(): ProjectFileData {
        return {
            id: this.id,
            directory: this.directory,
            name: this.name,
            version: this.version,
            description: this.description,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            tilemapPath: this.tilemap.map((tilemap) => {
                // TODO: Serialize tilemap
                return "";
            }),
            tilesetPath: this.tileset.map((tileset) => {
                // TODO: Serialize tileset
                return "";
            }),
        };
    }

    public addTilemap(tilemap: any) {
        // TODO: Add tilemap
    }

    public addTileset(tileset: any) {

    }

    static async createProject(): Promise<Project | null> {
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
            ]
        })
        if (!form) return null;
        
        const projectData: ProjectFileData = {
            id: uuidv4(),
            directory: form.destination,
            name: form.name,
            version: "0.1.0",
            description: "",
            createdAt: new Date(),
            updatedAt: new Date(),
            tilemapPath: [],
            tilesetPath: [],
        };

        return new Project(projectData);
    }
}