import { RulesetManager } from "@/application/resources/ruleset/ruleset.manager";
import { TilemapManager } from "@/application/resources/tilemap/tilemap.manager";
import { TilesetManager } from "@/application/resources/tileset/tileset.manager";
import { ProjectPathSystem } from "@/infrastructure/project-path-system";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { ProjectData, ProjectMetadata } from "@/shared/data-types/project.data";
import { Result } from "@/shared/types/result";
import { normalizeProjectData } from "./project.normalizer";
import { EntityCollectionManager } from "@/application/resources/entity/entity-collection.manager";

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

    public objectRegistry: EditorObjectRegistry;
    public tilesetManager: TilesetManager;
    public tilemapManager: TilemapManager;
    public rulesetManager: RulesetManager;
    public entityCollectionManager: EntityCollectionManager;

    private data: ProjectData;

    public constructor(data: ProjectData, public readonly projectPathSystem: ProjectPathSystem) {
        this.data = data;
        this.id = data.id;
        this.name = data.name;
        this.version = data.version;
        this.description = data.description;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;

        this.objectRegistry = new EditorObjectRegistry();
        
        this.tilesetManager = new TilesetManager(this.projectPathSystem, this.objectRegistry);
        this.rulesetManager = new RulesetManager(this.tilesetManager, this.projectPathSystem, this.objectRegistry);
        this.entityCollectionManager = new EntityCollectionManager(this.tilesetManager, this.projectPathSystem, this.objectRegistry);
        this.tilemapManager = new TilemapManager(this.tilesetManager, this.rulesetManager, this.entityCollectionManager, this.projectPathSystem, this.objectRegistry);
    }

    public static create(data: unknown, projectPathSystem: ProjectPathSystem): Result<Project> {
        try {
            const normalized = normalizeProjectData(data);
            return Result.Success(new Project(normalized, projectPathSystem));
        } catch (error) {
            return Result.Error(`Failed to create project: ${String(error)}`);
        }
    }

    public async load() {
        this.tilesetManager.loadTilesetsMetadata(this.data.tilesets);
        this.tilemapManager.loadTilemapsMetadata(this.data.tilemaps);
        this.rulesetManager.loadRulesetMetadata(this.data.rulesets);
        this.entityCollectionManager.loadEntityCollectionsMetadata(this.data.entityCollections);

        // Default to load all ruleset since ruleset is light and fast to load, and most of the time user will need them all. Can optimize later if needed.
        await this.rulesetManager.loadAllRulesets();

        // Replace this with true lazy loading when UI/resource usage sites request collections on demand.
        await this.entityCollectionManager.loadAllEntityCollections();
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
            entityCollections: this.entityCollectionManager.serialize(),
        };
    }

    public async destroy() {
        await this.tilemapManager.destroy();
        await this.rulesetManager.destroy();
        await this.tilesetManager.destroy();
        await this.entityCollectionManager.destroy();
        this.objectRegistry.clear();
    }
}
