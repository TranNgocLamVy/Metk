import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { ProjectPathSystem } from "@/infrastructure/project-path-system";
import { EntityCollectionData, EntityCollectionMetadata } from "@/shared/data-types/entity-collection.data";
import { ProjectData, ProjectMetadata } from "@/shared/data-types/project.data";
import { RulesetData, RulesetMetadata } from "@/shared/data-types/ruleset.data";
import { TilemapData, TilemapMetadata } from "@/shared/data-types/tilemap.data";
import { TilesetData, TilesetMetadata } from "@/shared/data-types/tileset.data";

export const createProjectPathSystem = () => new ProjectPathSystem("C:/Project/Metk/test-project");

export const createObjectRegistry = () => new EditorObjectRegistry();

export const createTilesetData = (id = "tileset-a", overrides: Partial<TilesetData> = {}): TilesetData => ({
    id,
    name: `${id} name`,
    columns: 2,
    rows: 2,
    tileWidth: 16,
    tileHeight: 16,
    image: {
        source: `textures/${id}.png`,
        width: 32,
        height: 32,
    },
    tiles: [],
    ...overrides,
});

export const createTilesetMetadata = (id = "tileset-a", overrides: Partial<TilesetMetadata> = {}): TilesetMetadata => ({
    id,
    name: `${id} metadata`,
    tilesetRelPath: `tilesets/${id}.json`,
    ...overrides,
});

export const createRulesetData = (id = "ruleset-a", overrides: Partial<RulesetData> = {}): RulesetData => ({
    id,
    name: `${id} name`,
    color: "#ffffff",
    size: 3,
    rules: [],
    tilesets: { refs: [], nextIndex: 0 },
    rulesets: { refs: [], nextIndex: 0 },
    ...overrides,
});

export const createRulesetMetadata = (id = "ruleset-a", overrides: Partial<RulesetMetadata> = {}): RulesetMetadata => ({
    id,
    name: `${id} metadata`,
    color: "#ffffff",
    rulesetRelPath: `rulesets/${id}.json`,
    ...overrides,
});

export const createEntityCollectionData = (id = "entity-collection-a", overrides: Partial<EntityCollectionData> = {}): EntityCollectionData => ({
    id,
    name: `${id} name`,
    entities: [],
    tilesets: { refs: [], nextIndex: 0 },
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-02T00:00:00.000Z",
    ...overrides,
});

export const createEntityCollectionMetadata = (id = "entity-collection-a", overrides: Partial<EntityCollectionMetadata> = {}): EntityCollectionMetadata => ({
    id,
    name: `${id} metadata`,
    entityCollectionRelPath: `entity-collections/${id}.json`,
    ...overrides,
});

export const createTilemapData = (id = "tilemap-a", overrides: Partial<TilemapData> = {}): TilemapData => ({
    id,
    name: `${id} name`,
    orientation: "orthogonal",
    width: 4,
    height: 4,
    tileWidth: 16,
    tileHeight: 16,
    backgroundcolor: "#00000000",
    tilesets: { refs: [], nextIndex: 0 },
    rulesets: { refs: [], nextIndex: 0 },
    entityCollections: { refs: [], nextIndex: 0 },
    layers: [],
    ...overrides,
});

export const createTilemapMetadata = (id = "tilemap-a", overrides: Partial<TilemapMetadata> = {}): TilemapMetadata => ({
    id,
    name: `${id} metadata`,
    tilemapRelPath: `tilemaps/${id}.json`,
    ...overrides,
});

export const createProjectData = (id = "project-a", overrides: Partial<ProjectData> = {}): ProjectData => ({
    id,
    name: `${id} name`,
    version: "0.1.0",
    description: "Test project",
    createdAt: "Mon Jan 01 2024",
    updatedAt: "Tue Jan 02 2024",
    tilemaps: [],
    tilesets: [],
    rulesets: [],
    entityCollections: [],
    ...overrides,
});

export const createProjectMetadata = (id = "project-a", overrides: Partial<ProjectMetadata> = {}): ProjectMetadata => ({
    id,
    name: `${id} metadata`,
    version: "0.1.0",
    description: "Test project metadata",
    createdAt: "Mon Jan 01 2024",
    updatedAt: "Tue Jan 02 2024",
    directory: `C:/Project/Metk/${id}`,
    ...overrides,
});

export const createDeferred = <T>() => {
    let resolve!: (value: T) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });

    return { promise, resolve, reject };
};
