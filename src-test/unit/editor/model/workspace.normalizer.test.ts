import { describe, expect, it } from "vitest";

import { normalizeWorkspaceData } from "@/editor/model/workspace/workspace.normalizer";
import { defaultWorkspaceData } from "@/shared/data-types/workspace.data";

const savedPath = {
    exportPaths: [{ tilemapId: "tilemap-a", exportPath: "C:/exports/tilemap-a.tmx" }],
    tilemapDir: "C:/maps",
    tilesetDir: "C:/tilesets",
    rulesetDir: "C:/rulesets",
    textureDir: "C:/textures",
};

const tilemapEditorWorkspace = {
    tilesets: {
        tilesetSessions: [{
            id: "tileset-session-a",
            tilesetId: "tileset-a",
            viewState: { x: 4, y: 8, zoom: 2 },
            selectionState: { selectedTilesSet: [1, 2, "bad"] },
        }],
        currentTilesetSessionId: "tileset-session-a",
    },
    tilemaps: {
        tilemapSessions: [{
            id: "tilemap-session-a",
            tilemapId: "tilemap-a",
            viewState: { x: 12, y: 24, zoom: 3 },
            layerState: { selectedLayers: ["tile-root", 12] },
        }],
        currentTilemapSessionId: "tilemap-session-a",
    },
    ruleset: {
        selectedRuleId: "rule-a",
    },
    entityCollection: {
        selectedEntityCollectionId: "entity-collection-a",
        selectedEntityId: "entity-a",
    },
    propertyPanel: {
        selectedObjectId: "object-a",
    },
    toolState: {
        tile: "tool.line",
        rule: "tool.bucket",
    },
};

describe("normalizeWorkspaceData", () => {
    it("loads the new tilemap editor workspace format and keeps savedPath top-level", () => {
        const normalized = normalizeWorkspaceData({
            tilemapEditorWorkspace,
            savedPath,
        });

        expect(normalized).toEqual({
            tilemapEditorWorkspace: {
                ...tilemapEditorWorkspace,
                tilesets: {
                    ...tilemapEditorWorkspace.tilesets,
                    tilesetSessions: [{
                        ...tilemapEditorWorkspace.tilesets.tilesetSessions[0],
                        selectionState: { selectedTilesSet: [1, 2] },
                    }],
                },
                tilemaps: {
                    ...tilemapEditorWorkspace.tilemaps,
                    tilemapSessions: [{
                        ...tilemapEditorWorkspace.tilemaps.tilemapSessions[0],
                        layerState: { selectedLayers: ["tile-root"] },
                    }],
                },
            },
            savedPath,
        });
        expect(normalized.savedPath).toEqual(savedPath);
        expect(normalized).not.toHaveProperty("tilesets");
        expect(normalized).not.toHaveProperty("tilemaps");
        expect(normalized).not.toHaveProperty("ruleset");
        expect(normalized).not.toHaveProperty("entityCollection");
        expect(normalized).not.toHaveProperty("propertyPanel");
        expect(normalized).not.toHaveProperty("toolState");
    });

    it("migrates legacy top-level editor workspace fields into tilemapEditorWorkspace", () => {
        const normalized = normalizeWorkspaceData({
            ...tilemapEditorWorkspace,
            savedPath,
        });

        expect(normalized.tilemapEditorWorkspace.ruleset).toEqual(tilemapEditorWorkspace.ruleset);
        expect(normalized.tilemapEditorWorkspace.entityCollection).toEqual(tilemapEditorWorkspace.entityCollection);
        expect(normalized.tilemapEditorWorkspace.propertyPanel).toEqual(tilemapEditorWorkspace.propertyPanel);
        expect(normalized.tilemapEditorWorkspace.toolState).toEqual(tilemapEditorWorkspace.toolState);
        expect(normalized.savedPath).toEqual(savedPath);
        expect(normalized).not.toHaveProperty("tilesets");
        expect(normalized).not.toHaveProperty("tilemaps");
        expect(normalized).not.toHaveProperty("ruleset");
        expect(normalized).not.toHaveProperty("entityCollection");
        expect(normalized).not.toHaveProperty("propertyPanel");
        expect(normalized).not.toHaveProperty("toolState");
    });

    it("ignores unsupported legacy currentToolFamily values during tool state normalization", () => {
        const normalized = normalizeWorkspaceData({
            tilemapEditorWorkspace: {
                ...tilemapEditorWorkspace,
                toolState: {
                    currentToolFamily: "tool.stamp",
                },
            },
            savedPath,
        });

        expect(normalized.tilemapEditorWorkspace.toolState).toEqual({});
        expect(normalized.tilemapEditorWorkspace.toolState).not.toHaveProperty("currentToolFamily");
    });

    it("ignores unsupported legacy currentToolFamily values during tool state normalization", () => {
        const normalized = normalizeWorkspaceData({
            tilemapEditorWorkspace: {
                ...tilemapEditorWorkspace,
                toolState: {
                    currentToolFamily: "tool.entity.place",
                },
            },
            savedPath,
        });

        expect(normalized.tilemapEditorWorkspace.toolState).toEqual({});
    });

    it("defaults to the new empty workspace shape for invalid input", () => {
        expect(normalizeWorkspaceData(null)).toEqual(defaultWorkspaceData);
    });
});
