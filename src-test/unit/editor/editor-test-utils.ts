import { RulesetManager } from "@/application/resources/ruleset/ruleset.manager";
import { TilesetManager } from "@/application/resources/tileset/tileset.manager";
import { RulesetRefManager } from "@/application/resources/references/ruleset-ref.manager";
import { TilesetRefManager } from "@/application/resources/references/tileset-ref.manager";
import { EntityCollectionRefManager } from "@/application/resources/references/entity-collection-ref.manager";
import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/project-path-system";
import { Ruleset } from "@/editor/model/ruleset/ruleset";
import { RulesetData } from "@/shared/data-types/ruleset.data";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { Tilemap } from "@/editor/model/tilemap/tilemap";
import { RootLayerData } from "@/shared/data-types/layer.data";
import { EntityCollectionManager } from "@/application/resources/entity/entity-collection.manager";

type ReferenceContextOptions = {
    tilesets?: string[];
    rulesets?: string[];
    fileId?: string;
    relPath?: string;
};

export const createReferenceContext = (options: ReferenceContextOptions = {}) => {
    const projectPathSystem = new ProjectPathSystem("C:/Project/Metk/test-project");
    const objectRegistry = new EditorObjectRegistry();
    const filePathSystem = new FilePathSystem(
        options.fileId ?? "resource",
        projectPathSystem,
        options.relPath ?? "resources/resource.json",
    );
    const tilesetManager = new TilesetManager(projectPathSystem, objectRegistry);

    for (const id of options.tilesets ?? []) {
        tilesetManager.addTilesetMetadata({
            id,
            name: `${id} name`,
            tilesetRelPath: `tilesets/${id}.json`,
        });
    }

    const rulesetManager = new RulesetManager(tilesetManager, projectPathSystem, objectRegistry);

    for (const id of options.rulesets ?? []) {
        rulesetManager.addRulesetMetadata({
            id,
            name: `${id} name`,
            color: "#ffffff",
            rulesetRelPath: `rulesets/${id}.json`,
        });
    }

    const tilesetRefManager = new TilesetRefManager(tilesetManager, filePathSystem);
    const rulesetRefManager = new RulesetRefManager(rulesetManager, filePathSystem);
    const entityCollectionManager = new EntityCollectionManager(tilesetManager, projectPathSystem, objectRegistry);
    const entityCollectionRefManager = new EntityCollectionRefManager(entityCollectionManager, filePathSystem);

    return {
        projectPathSystem,
        filePathSystem,
        objectRegistry,
        tilesetManager,
        rulesetManager,
        entityCollectionManager,
        tilesetRefManager,
        rulesetRefManager,
        entityCollectionRefManager,
    };
};

export const loadTilesetRefs = (manager: TilesetRefManager, ids: string[]) => {
    manager.loadData(ids.map((id, index) => ({ id, index, name: `${id} name` })), ids.length);
};

export const loadRulesetRefs = (manager: RulesetRefManager, ids: string[]) => {
    manager.loadData(ids.map((id, index) => ({ id, index, name: `${id} name` })), ids.length);
};

export const createTilemap = (
    context: ReturnType<typeof createReferenceContext>,
    layers: RootLayerData = [],
): Tilemap => {
    const result = Tilemap.createFromFileData(
        {
            id: "tilemap-a",
            name: "Tilemap A",
            orientation: "orthogonal",
            width: 8,
            height: 8,
            tilewidth: 16,
            tileheight: 16,
            tilesets: context.tilesetRefManager.serialize(),
            rulesets: context.rulesetRefManager.serialize(),
            entityCollections: context.entityCollectionRefManager.serialize(),
            layers,
        },
        context.filePathSystem,
        context.tilesetRefManager,
        context.rulesetRefManager,
        context.entityCollectionRefManager,
    );
    if (result.status !== "Success") throw new Error(String(result.message));
    return result.data;
};

export const createRulesetData = (overrides: Partial<RulesetData> = {}): RulesetData => ({
    id: "ruleset-a",
    name: "Ruleset A",
    color: "#ffffff",
    size: 3,
    rules: [],
    tilesets: { refs: [], nextIndex: 0 },
    rulesets: { refs: [], nextIndex: 0 },
    ...overrides,
});

export const registerLoadedRuleset = (rulesetManager: RulesetManager, ruleset: Ruleset) => {
    (rulesetManager as any).loadedRulesets.set(ruleset.id, ruleset);
};

export const createRuleset = (
    context: ReturnType<typeof createReferenceContext>,
    data: RulesetData = createRulesetData(),
): Ruleset => {
    const result = Ruleset.createFromFileData(data, context.filePathSystem, context.tilesetRefManager, context.rulesetRefManager);
    if (result.status !== "Success") throw new Error(String(result.message));
    return result.data;
};
