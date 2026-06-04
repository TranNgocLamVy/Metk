import { describe, expect, it } from "vitest";

import {
    buildPanelRegistry,
    getKnownPanelIds,
    hydratePersistedLayoutModel,
    normalizePersistedLayoutModel,
    serializeLayoutModel,
} from "@/application/layout/layout-persistence";
import { workspaceLayout } from "@/shared/constant/workspaceJsonModel";

const panelRegistry = buildPanelRegistry(workspaceLayout);
const knownPanelIds = getKnownPanelIds(panelRegistry);

describe("layout persistence", () => {
    it("serializes runtime FlexLayout data into compact project-owned shape only", () => {
        const serialized = serializeLayoutModel({
            global: { splitterSize: 999 },
            borders: [],
            popouts: {},
            layout: {
                type: "row",
                id: "#generated-row",
                weight: 80,
                children: [
                    {
                        type: "tabset",
                        id: "#generated-tabset",
                        weight: 25,
                        active: true,
                        enableDrop: false,
                        enableDrag: false,
                        enableMaximize: false,
                        enableTabStrip: false,
                        children: [
                            {
                                type: "tab",
                                id: "properties",
                                name: "Stale Properties",
                                component: "stale-component",
                                minHeight: 1,
                                minWidth: 1,
                                enableClose: true,
                            },
                        ],
                    },
                ],
            },
        }, { knownTabIds: knownPanelIds });

        expect(serialized).toEqual({
            version: 1,
            layout: {
                type: "row",
                weight: 80,
                children: [
                    {
                        type: "tabset",
                        weight: 25,
                        active: true,
                        children: [{ type: "tab", id: "properties" }],
                    },
                ],
            },
        });
        expect(JSON.stringify(serialized)).not.toContain("global");
        expect(JSON.stringify(serialized)).not.toContain("component");
        expect(JSON.stringify(serialized)).not.toContain("minWidth");
        expect(JSON.stringify(serialized)).not.toContain("enableClose");
    });

    it("serializes main editor tabset id without saving developer-owned config", () => {
        const serialized = serializeLayoutModel({
            global: { splitterSize: 999 },
            borders: [],
            popouts: {},
            layout: {
                type: "row",
                children: [
                    {
                        type: "tabset",
                        id: "mainEditorTabset",
                        weight: 80,
                        active: true,
                        enableDrag: false,
                        enableDrop: false,
                        enableMaximize: false,
                        enableTabStrip: false,
                        children: [
                            {
                                type: "tab",
                                id: "tilemapEditor",
                                name: "TilemapEditor",
                                component: "tilemapEditor",
                                enableClose: false,
                                minHeight: 400,
                                minWidth: 400,
                            },
                        ],
                    },
                ],
            },
        }, { knownTabIds: knownPanelIds });

        expect(serialized).toEqual({
            version: 1,
            layout: {
                type: "row",
                children: [
                    {
                        type: "tabset",
                        id: "mainEditorTabset",
                        weight: 80,
                        active: true,
                        children: [{ type: "tab", id: "tilemapEditor" }],
                    },
                ],
            },
        });

        const serializedText = JSON.stringify(serialized);
        expect(serializedText).not.toContain("global");
        expect(serializedText).not.toContain("borders");
        expect(serializedText).not.toContain("popouts");
        expect(serializedText).not.toContain("enableDrag");
        expect(serializedText).not.toContain("enableDrop");
        expect(serializedText).not.toContain("enableMaximize");
        expect(serializedText).not.toContain("enableTabStrip");
        expect(serializedText).not.toContain("enableClose");
        expect(serializedText).not.toContain("minWidth");
        expect(serializedText).not.toContain("minHeight");
        expect(serializedText).not.toContain("name");
        expect(serializedText).not.toContain("component");
    });

    it("rejects legacy full FlexLayout data instead of migrating it", () => {
        const normalized = normalizePersistedLayoutModel({
            global: { splitterSize: 999 },
            layout: {
                type: "row",
                children: [
                    {
                        type: "tabset",
                        children: [
                            {
                                type: "tab",
                                id: "#85dbe93e",
                                component: "tilemapEditor",
                                name: "Old Tilemap Editor",
                            },
                        ],
                    },
                ],
            },
        }, knownPanelIds);

        expect(normalized).toBeNull();
        expect(hydratePersistedLayoutModel(normalized, workspaceLayout, panelRegistry)).toEqual(workspaceLayout);
    });

    it("normalizes invalid, unknown, duplicate, and empty layout nodes", () => {
        const normalized = normalizePersistedLayoutModel({
            version: 1,
            layout: {
                type: "row",
                weight: -1,
                active: false,
                children: [
                    { type: "mystery", children: [] },
                    {
                        type: "tabset",
                        weight: Number.POSITIVE_INFINITY,
                        active: true,
                        children: [
                            { type: "tab", id: "properties" },
                            { type: "tab", id: "deletedPanel" },
                            { type: "tab", id: "properties" },
                        ],
                    },
                    { type: "tabset", children: [] },
                    { type: "col", children: [{ type: "tabset", children: [{ type: "tab", id: "layerManager" }] }] },
                ],
            },
        }, knownPanelIds);

        expect(normalized).toEqual({
            version: 1,
            layout: {
                type: "row",
                children: [
                    {
                        type: "tabset",
                        active: true,
                        children: [{ type: "tab", id: "properties" }],
                    },
                    {
                        type: "col",
                        children: [
                            {
                                type: "tabset",
                                children: [{ type: "tab", id: "layerManager" }],
                            },
                        ],
                    },
                ],
            },
        });
    });

    it("hydrates tabs from current workspace developer config", () => {
        const hydrated = hydratePersistedLayoutModel({
            version: 1,
            layout: {
                type: "row",
                children: [
                    {
                        type: "tabset",
                        children: [{ type: "tab", id: "properties" }],
                    },
                ],
            },
        }, workspaceLayout, panelRegistry);

        expect(hydrated.global).toEqual(workspaceLayout.global);
        expect(hydrated).not.toHaveProperty("borders");
        expect(hydrated).not.toHaveProperty("popouts");
        expect(hydrated.layout.children[0]).toEqual({
            type: "tabset",
            children: [
                {
                    type: "tab",
                    id: "properties",
                    name: "Properties",
                    minHeight: 200,
                    minWidth: 280,
                    component: "properties",
                    enableClose: false,
                },
            ],
        });
    });

    it("hydrates stable-id tabsets from current workspace developer config", () => {
        const hydrated = hydratePersistedLayoutModel({
            version: 1,
            layout: {
                type: "row",
                children: [
                    {
                        type: "tabset",
                        id: "mainEditorTabset",
                        weight: 55,
                        active: true,
                        children: [{ type: "tab", id: "tilemapEditor" }],
                    },
                ],
            },
        }, workspaceLayout, panelRegistry);

        expect(hydrated.global).toEqual(workspaceLayout.global);
        expect(hydrated.layout.children[0]).toEqual({
            type: "tabset",
            id: "mainEditorTabset",
            weight: 55,
            active: true,
            enableDrag: false,
            enableDrop: false,
            enableMaximize: false,
            enableTabStrip: false,
            children: [
                {
                    type: "tab",
                    id: "tilemapEditor",
                    name: "TilemapEditor",
                    component: "tilemapEditor",
                    enableClose: false,
                    minHeight: 400,
                    minWidth: 400,
                },
            ],
        });
    });

    it("falls back to the workspace layout when the normalized layout is invalid", () => {
        expect(normalizePersistedLayoutModel({
            version: 1,
            layout: {
                type: "row",
                children: [{ type: "tabset", children: [{ type: "tab", id: "deletedPanel" }] }],
            },
        }, knownPanelIds)).toBeNull();

        expect(hydratePersistedLayoutModel(null, workspaceLayout, panelRegistry)).toEqual(workspaceLayout);
    });
});
