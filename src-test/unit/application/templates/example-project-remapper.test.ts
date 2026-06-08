import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ExampleProjectRemapper } from "@/application/templates/example-project-remapper";
import { IFileSystemService } from "@/infrastructure/interface/file-system-service.interface";
import { Result } from "@/shared/types/result";

const uuidMock = vi.hoisted(() => ({
    next: vi.fn(),
}));

vi.mock("uuid", () => ({
    v4: uuidMock.next,
}));

const createMemoryFileSystem = (files: Record<string, unknown>): IFileSystemService & {
    files: Map<string, string>;
} => {
    const fileMap = new Map(
        Object.entries(files).map(([path, value]) => [
            path,
            typeof value === "string" ? value : JSON.stringify(value),
        ]),
    );

    return {
        files: fileMap,
        exists: vi.fn(async (path: string) => fileMap.has(path)),
        readDir: vi.fn(),
        readFile: vi.fn(),
        readTextFile: vi.fn(async (path: string) => {
            const value = fileMap.get(path);
            if (value === undefined) throw new Error(`Missing file: ${path}`);
            return value;
        }),
        copyFile: vi.fn(),
        writeFile: vi.fn(),
        writeTextFile: vi.fn(async (path: string, content: string) => {
            fileMap.set(path, content);
            return Result.Success();
        }),
        mkdir: vi.fn(async () => Result.Success()),
        removeFile: vi.fn(),
    };
};

describe("ExampleProjectRemapper", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-06-06T00:00:00.000Z"));
        uuidMock.next.mockImplementation(() => `new-${uuidMock.next.mock.calls.length}`);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it("remaps a copied project graph with one central id map while preserving paths and numeric tile ids", async () => {
        const fileSystem = createMemoryFileSystem({
            "C:/clone/.metk/project.json": {
                id: "project-old",
                name: "Template Project",
                version: "0.1.0",
                description: "",
                createdAt: "template-created",
                updatedAt: "template-updated",
                tilemaps: [{ id: "tilemap-old", name: "Map", tilemapRelPath: "tilemaps/main.json" }],
                tilesets: [{ id: "tileset-old", name: "Tiles", tilesetRelPath: "tilesets/tiles.json" }],
                rulesets: [{ id: "ruleset-old", name: "Rules", color: "#ffffff", rulesetRelPath: "rulesets/rules.json" }],
                entityCollections: [{ id: "entity-collection-old", name: "Entities", entityCollectionRelPath: "entity-collections/entities.json" }],
            },
            "C:/clone/.metk/session.json": {
                tilemapEditorWorkspace: {
                    tilesets: {
                        tilesetSessions: [
                            {
                                id: "tileset-session-old",
                                tilesetId: "tileset-old",
                                viewState: { x: 0, y: 0, zoom: 1 },
                                selectionState: { selectedTilesSet: [0] },
                            },
                        ],
                        currentTilesetSessionId: "tileset-session-old",
                    },
                    tilemaps: {
                        tilemapSessions: [
                            {
                                id: "tilemap-session-old",
                                tilemapId: "tilemap-old",
                                viewState: { x: 0, y: 0, zoom: 1 },
                                layerState: {
                                    selectedLayers: ["group-layer-old", "entity-layer-old"],
                                },
                            },
                        ],
                        currentTilemapSessionId: "tilemap-session-old",
                    },
                    ruleset: {
                        selectedRuleId: "rule-old",
                    },
                    entityCollection: {
                        selectedEntityCollectionId: "entity-collection-old",
                        selectedEntityId: "entity-def-old",
                    },
                    propertyPanel: {
                        selectedObjectId: "tilemap:tilemap-old:layer:group-layer-old",
                    },
                    toolState: {},
                },
                savedPath: {
                    exportPaths: [{ tilemapId: "tilemap-old", exportPath: "C:/exports/main.tmx" }],
                    tilemapDir: null,
                    tilesetDir: null,
                    rulesetDir: null,
                    textureDir: null,
                },
            },
            "C:/clone/tilemaps/main.json": {
                id: "tilemap-old",
                name: "Map",
                orientation: "orthogonal",
                height: 8,
                width: 8,
                tileWidth: 16,
                tileHeight: 16,
                backgroundcolor: "#00000000",
                tilesets: { refs: [{ id: "tileset-old", name: "Tiles", index: 0 }], nextIndex: 1 },
                rulesets: { refs: [{ id: "ruleset-old", name: "Rules", index: 0 }], nextIndex: 1 },
                entityCollections: { refs: [{ id: "entity-collection-old", name: "Entities", index: 0 }], nextIndex: 1 },
                layers: [
                    {
                        id: "group-layer-old",
                        type: "group",
                        layers: [
                            {
                                id: "entity-layer-old",
                                type: "entity",
                                entities: [
                                    {
                                        id: "entity-instance-old",
                                        entityRef: {
                                            entityCollectionId: "entity-collection-old",
                                            entityDefinitionId: "entity-def-old",
                                        },
                                        x: 1,
                                        y: 2,
                                        fields: {
                                            "field-old": "entity-def-old",
                                            untouched: "not-an-id",
                                        },
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            "C:/clone/tilesets/tiles.json": {
                id: "tileset-old",
                name: "Tiles",
                type: "single-image",
                columns: 1,
                rows: 1,
                tileWidth: 16,
                tileHeight: 16,
                image: { source: "../assets/tiles.png", width: 16, height: 16 },
                tiles: [
                    {
                        id: 0,
                        collisionObjects: [
                            { id: "collision-old", kind: "box", name: "Solid", x: 0, y: 0, width: 16, height: 16 },
                        ],
                    },
                ],
            },
            "C:/clone/rulesets/rules.json": {
                id: "ruleset-old",
                name: "Rules",
                color: "#ffffff",
                size: 3,
                rules: [{ id: "rule-old", constraints: "[]", outputs: "[]" }],
                tilesets: { refs: [{ id: "tileset-old", name: "Tiles", index: 0 }], nextIndex: 1 },
                rulesets: { refs: [{ id: "ruleset-old", name: "Rules", index: 0 }], nextIndex: 1 },
            },
            "C:/clone/entity-collections/entities.json": {
                id: "entity-collection-old",
                name: "Entities",
                entities: [
                    {
                        id: "entity-def-old",
                        name: "Player",
                        width: 16,
                        height: 16,
                        graphic: { type: "tile", tilesetId: "tileset-old", tileId: 0 },
                        fields: [
                            { id: "field-old", name: "Target", type: "entity_ref", value: "entity-def-old" },
                        ],
                    },
                ],
                tilesets: { refs: [{ id: "tileset-old", name: "Tiles", index: 0 }], nextIndex: 1 },
                createdAt: "template-created",
                updatedAt: "template-updated",
            },
        });

        const result = await new ExampleProjectRemapper(fileSystem).remapProject({
            projectAbsDir: "C:/clone",
            projectEntryRelPath: ".metk/project.json",
            projectName: "My Starter Example",
            preserveCloneSource: true,
        });

        expect(result.status).toBe(Result.Status.Success);

        const project = JSON.parse(fileSystem.files.get("C:/clone/.metk/project.json")!);
        const tilemap = JSON.parse(fileSystem.files.get("C:/clone/tilemaps/main.json")!);
        const tileset = JSON.parse(fileSystem.files.get("C:/clone/tilesets/tiles.json")!);
        const ruleset = JSON.parse(fileSystem.files.get("C:/clone/rulesets/rules.json")!);
        const entityCollection = JSON.parse(fileSystem.files.get("C:/clone/entity-collections/entities.json")!);
        const session = JSON.parse(fileSystem.files.get("C:/clone/.metk/session.json")!);

        expect(project).toMatchObject({
            id: "new-1",
            name: "My Starter Example",
            createdAt: "2026-06-06T00:00:00.000Z",
            updatedAt: "2026-06-06T00:00:00.000Z",
        });
        expect(project.tilemaps[0]).toMatchObject({ id: "new-2", tilemapRelPath: "tilemaps/main.json" });
        expect(project.tilesets[0]).toMatchObject({ id: "new-3", tilesetRelPath: "tilesets/tiles.json" });
        expect(project.rulesets[0]).toMatchObject({ id: "new-4", rulesetRelPath: "rulesets/rules.json" });
        expect(project.entityCollections[0]).toMatchObject({ id: "new-5", entityCollectionRelPath: "entity-collections/entities.json" });

        expect(tilemap.id).toBe("new-2");
        expect(tilemap.tilesets.refs[0].id).toBe("new-3");
        expect(tilemap.rulesets.refs[0].id).toBe("new-4");
        expect(tilemap.entityCollections.refs[0].id).toBe("new-5");
        expect(tilemap.layers[0].id).toBe("new-6");
        expect(tilemap.layers[0].layers[0].id).toBe("new-7");
        expect(tilemap.layers[0].layers[0].entities[0]).toMatchObject({
            id: "new-8",
            entityRef: {
                entityCollectionId: "new-5",
                entityDefinitionId: "new-11",
            },
            fields: {
                "new-12": "new-11",
                untouched: "not-an-id",
            },
        });

        expect(tileset).toMatchObject({ id: "new-3", cloneFrom: "tileset-old" });
        expect(tileset.image.source).toBe("../assets/tiles.png");
        expect(tileset.tiles[0].id).toBe(0);
        expect(tileset.tiles[0].collisionObjects[0]).toMatchObject({
            id: "new-9",
            cloneFrom: "collision-old",
        });

        expect(ruleset).toMatchObject({ id: "new-4", cloneFrom: "ruleset-old" });
        expect(ruleset.rules[0]).toMatchObject({ id: "new-10", cloneFrom: "rule-old" });
        expect(ruleset.tilesets.refs[0].id).toBe("new-3");
        expect(ruleset.rulesets.refs[0].id).toBe("new-4");

        expect(entityCollection).toMatchObject({
            id: "new-5",
            cloneFrom: "entity-collection-old",
            createdAt: "2026-06-06T00:00:00.000Z",
            updatedAt: "2026-06-06T00:00:00.000Z",
        });
        expect(entityCollection.tilesets.refs[0].id).toBe("new-3");
        expect(entityCollection.entities[0]).toMatchObject({
            id: "new-11",
            cloneFrom: "entity-def-old",
            graphic: { type: "tile", tilesetId: "new-3", tileId: 0 },
        });
        expect(entityCollection.entities[0].fields[0]).toMatchObject({
            id: "new-12",
            cloneFrom: "field-old",
            value: "new-11",
        });

        expect(session.tilemapEditorWorkspace.tilesets).toMatchObject({
            currentTilesetSessionId: "new-13",
            tilesetSessions: [
                {
                    id: "new-13",
                    tilesetId: "new-3",
                    selectionState: { selectedTilesSet: [0] },
                },
            ],
        });
        expect(session.tilemapEditorWorkspace.tilemaps).toMatchObject({
            currentTilemapSessionId: "new-14",
            tilemapSessions: [
                {
                    id: "new-14",
                    tilemapId: "new-2",
                    layerState: {
                        selectedLayers: ["new-6", "new-7"],
                    },
                },
            ],
        });
        expect(session.tilemapEditorWorkspace.ruleset.selectedRuleId).toBe("new-10");
        expect(session.tilemapEditorWorkspace.entityCollection).toMatchObject({
            selectedEntityCollectionId: "new-5",
            selectedEntityId: "new-11",
        });
        expect(session.tilemapEditorWorkspace.propertyPanel.selectedObjectId).toBe("tilemap:new-2:layer:new-6");
        expect(session.savedPath.exportPaths[0]).toMatchObject({
            tilemapId: "new-2",
            exportPath: "C:/exports/main.tmx",
        });
    });
});
