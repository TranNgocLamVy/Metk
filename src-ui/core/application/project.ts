import { ProjectData, ProjectMetadata } from "../../shared/schema/projectSchema";
import { TilemapManager } from "../manager/tilemapManager";
import { TilesetManager } from "../manager/tilesetManager";
import { ProjectPathSystem } from "@/infrastructure/projectPathSystem";
import { RulesetManager } from "../manager/rulesetManager";

export class Project {
    public readonly id: string;
    public name: string;
    public version: string;
    public description: string;
    public createdAt: string;
    public updatedAt: string;

    public get metaData(): ProjectMetadata {
        return {
            id: this.id,
            name: this.name,
            version: this.version,
            description: this.description,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            directory: this.projectPathSystem.absDir,
        }
    }
    
    public tilesetManager: TilesetManager;
    public tilemapManager: TilemapManager;
    public rulesetManager: RulesetManager;

    constructor(private data: ProjectData, public readonly projectPathSystem: ProjectPathSystem) {
        this.id = data.id;
        this.name = data.name;
        this.version = data.version;
        this.description = data.description;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;

        this.tilesetManager = new TilesetManager(this.projectPathSystem);
        this.rulesetManager = new RulesetManager(this.tilesetManager, this.projectPathSystem);
        this.tilemapManager = new TilemapManager(this.tilesetManager, this.rulesetManager, this.projectPathSystem);
    }

    public async load() {
        this.tilesetManager.loadTilesetsMetadata(this.data.tilesets);
        this.tilemapManager.loadTilemapsMetada(this.data.tilemaps);
        this.rulesetManager.setRulesetMetadatas(this.data.rulesets);
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
            tilemaps: this.tilemapManager.serialize(),
            tilesets: this.tilesetManager.serialize(),
            rulesets: this.rulesetManager.serialize(),
        };
    }
}