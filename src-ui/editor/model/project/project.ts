import { RulesetManager } from "@/application/resources/ruleset/ruleset.manager";
import { TilemapManager } from "@/application/resources/tilemap/tilemap.manager";
import { TilesetManager } from "@/application/resources/tileset/tileset.manager";
import { ProjectPathSystem } from "@/infrastructure/projectPathSystem";
import { ProjectData, ProjectMetadata } from "@/shared/schema/project.schema";


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
        this.rulesetManager.loadRulesetMetadata(this.data.rulesets);

        // Default to load all ruleset since ruleset is light and fast to load, and most of the time user will need them all. Can optimize later if needed.
        await this.rulesetManager.loadRulesets(this.data.rulesets.map(ruleset => ruleset.id)); 
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