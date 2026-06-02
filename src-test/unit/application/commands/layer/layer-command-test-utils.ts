import { vi } from "vitest";

import { EditorFacade } from "@/application/editor.facade";
import { IGroupLayer } from "@/editor/model/tilemap/layer/base-layer";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { RootLayer } from "@/editor/model/tilemap/layer/root-layer";
import { Tilemap } from "@/editor/model/tilemap/tilemap";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/project-path-system";
import { GroupLayerData, RootLayerData, RuleLayerData, TileLayerData } from "@/shared/data-types/layer.data";
import { TilemapData } from "@/shared/data-types/tilemap.data";

import { createReferenceContext } from "../../../editor/editor-test-utils";

export const createTileLayerData = (overrides: Partial<TileLayerData> = {}): TileLayerData => ({
    id: "new-tile",
    type: "tile",
    name: "New Tile",
    x: 0,
    y: 0,
    width: 2,
    height: 2,
    opacity: 1,
    visible: true,
    locked: false,
    offsetx: 0,
    offsety: 0,
    layerData: "0,0\n0,0",
    ...overrides,
});

export const createRuleLayerData = (overrides: Partial<RuleLayerData> = {}): RuleLayerData => ({
    id: "new-rule",
    type: "auto_rule",
    name: "New Rule",
    x: 0,
    y: 0,
    width: 2,
    height: 2,
    opacity: 1,
    visible: true,
    locked: false,
    offsetx: 0,
    offsety: 0,
    layerData: "0,0\n0,0",
    ...overrides,
});

export const createGroupLayerData = (overrides: Partial<GroupLayerData> = {}): GroupLayerData => ({
    id: "new-group",
    type: "group",
    name: "New Group",
    opacity: 1,
    open: false,
    visible: true,
    locked: false,
    layers: [],
    ...overrides,
});

export const createBaseLayers = (): RootLayerData => [
    createGroupLayerData({
        id: "group-a",
        name: "Group A",
        open: false,
        layers: [
            createGroupLayerData({ id: "group-child", name: "Nested Group", open: false, layers: [] }),
            createTileLayerData({ id: "tile-a", name: "Ground", layerData: "1:0,0\n0,0" }),
        ],
    }),
    createGroupLayerData({ id: "group-b", name: "Group B", open: false }),
    createTileLayerData({ id: "tile-root", name: "Root Tile", layerData: "0,2:0\n0,0" }),
    createRuleLayerData({ id: "rule-root", name: "Root Rules", layerData: "0:-1:-1,0\n0,0" }),
];

export const createTilemap = (layers = createBaseLayers()): Tilemap => {
    const context = createReferenceContext({ tilesets: ["tileset-a"], rulesets: ["ruleset-a"] });
    const projectPathSystem = new ProjectPathSystem("C:/Project/Metk/test-project");
    const filePathSystem = new FilePathSystem("tilemap-a", projectPathSystem, "tilemaps/tilemap-a.json");
    const tilemapData: TilemapData = {
        id: "tilemap-a",
        name: "Layer Command Map",
        orientation: "orthogonal",
        width: 4,
        height: 4,
        tileWidth: 16,
        tileHeight: 16,
        backgroundcolor: "#00000000",
        tilesets: { refs: [{ id: "tileset-a", index: 0, name: "Tileset A" }], nextIndex: 1 },
        rulesets: { refs: [{ id: "ruleset-a", index: 0, name: "Ruleset A" }], nextIndex: 1 },
        entityCollections: { refs: [], nextIndex: 0 },
        layers,
    };

    const result = Tilemap.createFromFileData(
        tilemapData,
        filePathSystem,
        context.tilesetRefManager,
        context.rulesetRefManager,
        context.entityCollectionRefManager,
    );
    if (result.status !== "Success") throw new Error(String(result.message));
    return result.data;
};

export const createLayerCommandHarness = (layers = createBaseLayers()) => {
    const tilemap = createTilemap(layers);
    const objectRegistry = new EditorObjectRegistry();
    objectRegistry.registerTree(tilemap);
    const markLayerChange = vi.fn();
    const emit = vi.fn();
    const session = {
        tilemap,
        isDirty: false,
        layerState: { selectedLayers: ["tile-root"] },
        markLayerChange,
        emit,
    };
    const tilemapSessionManager = {
        getSessionByTilemapId: vi.fn(() => session),
    };
    const editorFacade = {
        objectRegistry,
        currentWorkspace: { tilemapSessionManager },
    } as unknown as EditorFacade;

    return { tilemap, root: tilemap.rootLayer, session, markLayerChange, emit, editorFacade, objectRegistry };
};

export const createNoSessionFacade = () => ({
    objectRegistry: new EditorObjectRegistry(),
}) as unknown as EditorFacade;

export const layerIds = (parent: IGroupLayer): string[] => parent.layers.map((layer) => layer.id);

export const layerObjectId = (root: RootLayer, id: string): string => {
    const layer = root.findLayer(id);
    if (!layer) throw new Error(`Expected ${id} to exist`);
    return layer.objectId;
};

export const requireGroupLayer = (root: RootLayer, id: string): GroupLayer => {
    const layer = root.findLayer(id);
    if (!(layer instanceof GroupLayer)) throw new Error(`Expected ${id} to be a group layer`);
    return layer;
};
