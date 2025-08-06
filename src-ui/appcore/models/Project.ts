import EventEmitter from "eventemitter3";
import { type } from "arktype"

export const ProjectDataParser = type({
    id: "string",
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
        this.name = data.name;
        this.version = data.version;
        this.description = data.description;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;

        data.tilemapPath.forEach((path) => {
            // TODO: Load tilemap
        });

        data.tilesetPath.forEach((path) => {
            // TODO: Load tileset
        });
    }

    public serialize(): ProjectFileData {
        return {
            id: this.id,
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

    static createProject(data: string): Project | null {
        const projectData = ProjectDataParser(data);
        if (projectData instanceof type.errors) {
            console.error(projectData);
            return null;
        }
        return new Project(projectData);
    }
}