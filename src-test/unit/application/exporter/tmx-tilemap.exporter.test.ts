import { XMLParser } from "fast-xml-parser";
import { describe, expect, it } from "vitest";

import { TmxTilemapExporter } from "@/application/exporter/tmx-tilemap.exporter";
import { FilePathSystem } from "@/infrastructure/project-path-system";
import { Tilemap } from "@/editor/model/tilemap/tilemap";
import { Tileset } from "@/editor/model/tileset/tileset";
import { Ruleset } from "@/editor/model/ruleset/ruleset";
import { TilemapData } from "@/shared/schema/tilemap.schema";
import { TilesetData } from "@/shared/schema/tileset.schema";
import {
    createReferenceContext,
    createRulesetData,
    registerLoadedRuleset,
} from "../../editor/editor-test-utils";

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    parseAttributeValue: true,
    trimValues: true,
});
const orderedParser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    parseAttributeValue: true,
    preserveOrder: true,
    trimValues: true,
});

const decode = (bytes: Uint8Array) => new TextDecoder().decode(bytes);
const asArray = <T,>(value: T | T[] | undefined): T[] => value === undefined ? [] : Array.isArray(value) ? value : [value];
const exportXml = (tilemap: Tilemap, exportPath = "C:/Project/Metk/test-project/exports/map-a.tmx") => {
    return decode(new TmxTilemapExporter().export(tilemap, exportPath, {} as any));
};

const createTilesetData = (overrides: Partial<TilesetData>): TilesetData => ({
    id: "tileset",
    name: "Tileset",
    columns: 1,
    rows: 1,
    tilewidth: 16,
    tileheight: 16,
    image: {
        source: "tiles.png",
        width: 16,
        height: 16,
    },
    tiles: [{ id: 0 }],
    ...overrides,
});

const registerLoadedTileset = (
    context: ReturnType<typeof createReferenceContext>,
    data: TilesetData,
    relPath: string,
) => {
    const pathSystem = new FilePathSystem(data.id, context.projectPathSystem, relPath);
    const tileset = new Tileset(data, pathSystem);
    (context.tilesetManager as any).loadedTilesets.set(data.id, tileset);
};

const exportParsed = (tilemap: Tilemap, exportPath = "C:/Project/Metk/test-project/exports/map-a.tmx") => {
    return parser.parse(exportXml(tilemap, exportPath));
};

const orderedChildIds = (xml: string, parentElement: "map" | "group" = "map", parentId?: string): string[] => {
    const parsed = orderedParser.parse(xml);
    const findElement = (nodes: any[]): any[] | null => {
        for (const node of nodes) {
            const children = node[parentElement];
            if (children) {
                if (!parentId || node[":@"]?.id === parentId) return children;
                const nested = findElement(children);
                if (nested) return nested;
            }
            for (const key of ["map", "group"]) {
                if (node[key]) {
                    const nested = findElement(node[key]);
                    if (nested) return nested;
                }
            }
        }
        return null;
    };

    return (findElement(parsed) ?? [])
        .filter((node: any) => node.layer || node.group)
        .map((node: any) => node[":@"]?.id);
};

const createTilemap = (context: ReturnType<typeof createReferenceContext>, overrides: Partial<TilemapData> = {}) => {
    const defaultLayer: TilemapData["layers"][number] = {
        id: "ground",
        parentId: "root",
        type: "tile",
        name: "Ground",
        x: 1,
        y: 2,
        width: 2,
        height: 2,
        opacity: 0.5,
        visible: false,
        locked: true,
        offsetx: 0,
        offsety: 0,
        layerData: "1:0,0:1\n2:0,5:99",
    };
    const data: TilemapData = {
        id: "map-a",
        name: "Map A",
        orientation: "orthogonal",
        width: 2,
        height: 2,
        tilewidth: 16,
        tileheight: 16,
        backgroundcolor: "#00000000",
        tilesets: {
            refs: [
                { index: 1, id: "decor", name: "Decor" },
                { index: 0, id: "terrain", name: "Terrain" },
            ],
            nextIndex: 2,
        },
        rulesets: { refs: [], nextIndex: 0 },
        layers: [defaultLayer],
        ...overrides,
    };

    return new Tilemap(data, context.filePathSystem, context.tilesetRefManager, context.rulesetRefManager);
};

describe("TmxTilemapExporter", () => {
    it("exports map metadata, tilesets, and tile layer gids consistently", () => {
        const context = createReferenceContext();
        registerLoadedTileset(context, createTilesetData({
            id: "terrain",
            name: "Terrain",
            columns: 3,
            rows: 1,
            image: { source: "terrain.png", width: 48, height: 16 },
            tiles: [{ id: 0 }, { id: 1 }, { id: 2 }],
        }), "tilesets/terrain.json");
        registerLoadedTileset(context, createTilesetData({
            id: "decor",
            name: "Decor",
            columns: 2,
            rows: 1,
            image: { source: "../textures/decor.png", width: 32, height: 16 },
            tiles: [{ id: 0 }, { id: 1 }],
        }), "tilesets/decor.json");

        const xml = decode(new TmxTilemapExporter().export(
            createTilemap(context),
            "C:/Project/Metk/test-project/exports/map-a.tmx",
            {} as any,
        ));
        const parsed = parser.parse(xml);

        expect(parsed.map).toEqual(expect.objectContaining({
            version: 1.1,
            tiledversion: "1.10.2",
            orientation: "orthogonal",
            width: 2,
            height: 2,
            tilewidth: 16,
            tileheight: 16,
        }));
        expect(parsed.map.tileset).toEqual([
            expect.objectContaining({
                firstgid: 1,
                name: "Terrain",
                tilewidth: 16,
                tileheight: 16,
                tilecount: 3,
                columns: 3,
                image: expect.objectContaining({ source: "../tilesets/terrain.png", width: 48, height: 16 }),
            }),
            expect.objectContaining({
                firstgid: 4,
                name: "Decor",
                tilecount: 2,
                columns: 2,
                image: expect.objectContaining({ source: "../textures/decor.png", width: 32, height: 16 }),
            }),
        ]);
        expect(parsed.map.layer).toEqual(expect.objectContaining({
            id: "ground",
            name: "Ground",
            width: 2,
            height: 2,
            x: 1,
            y: 2,
            opacity: 0.5,
            visible: 0,
            locked: 1,
            data: {
                encoding: "csv",
                "#text": "2,4,3,0",
            },
        }));
    });

    it("does not reuse tileset gid state between exports", () => {
        const context = createReferenceContext();
        registerLoadedTileset(context, createTilesetData({
            id: "terrain",
            name: "Terrain",
            columns: 1,
            rows: 1,
            tiles: [{ id: 0 }],
        }), "tilesets/terrain.json");

        const exporter = new TmxTilemapExporter();
        exporter.export(createTilemap(context, {
            tilesets: { refs: [{ index: 0, id: "terrain", name: "Terrain" }], nextIndex: 1 },
            layers: [{
                id: "first",
                parentId: "root",
                type: "tile",
                name: "First",
                x: 0,
                y: 0,
                width: 2,
                height: 2,
                opacity: 1,
                visible: true,
                locked: false,
                offsetx: 0,
                offsety: 0,
                layerData: "0:0,0\n0,0",
            }],
        }), "C:/Project/Metk/test-project/exports/first.tmx", {} as any);

        const second = createTilemap(context, {
            tilesets: { refs: [], nextIndex: 0 },
            layers: [{
                id: "second",
                parentId: "root",
                type: "tile",
                name: "Second",
                x: 0,
                y: 0,
                width: 2,
                height: 2,
                opacity: 1,
                visible: true,
                locked: false,
                offsetx: 0,
                offsety: 0,
                layerData: "0:0,0\n0,0",
            }],
        });

        const parsed = parser.parse(decode(exporter.export(
            second,
            "C:/Project/Metk/test-project/exports/second.tmx",
            {} as any,
        )));

        expect(parsed.map.tileset).toBeUndefined();
        expect(parsed.map.layer.data["#text"]).toBe("0,0,0,0");
    });

    it("exports nested groups with effective visibility, lock flags, and render ordering", () => {
        const context = createReferenceContext();
        registerLoadedTileset(context, createTilesetData({
            id: "terrain",
            name: "Terrain",
            columns: 3,
            rows: 1,
            tiles: [{ id: 0 }, { id: 1 }, { id: 2 }],
        }), "tilesets/terrain.json");

        const tilemap = createTilemap(context, {
            tilesets: { refs: [{ index: 0, id: "terrain", name: "Terrain" }], nextIndex: 1 },
            layers: [
                {
                    id: "bottom-tile",
                    parentId: "root",
                    type: "tile",
                    name: "Bottom Tile",
                    x: 0,
                    y: 0,
                    width: 1,
                    height: 1,
                    opacity: 1,
                    visible: true,
                    locked: false,
                    offsetx: 0,
                    offsety: 0,
                    layerData: "1:0",
                },
                {
                    id: "parent-group",
                    parentId: "root",
                    type: "group",
                    name: "Parent Group",
                    opacity: 1,
                    open: true,
                    visible: false,
                    locked: true,
                },
                {
                    id: "child-tile",
                    parentId: "parent-group",
                    type: "tile",
                    name: "Child Tile",
                    x: 0,
                    y: 0,
                    width: 1,
                    height: 1,
                    opacity: 1,
                    visible: true,
                    locked: false,
                    offsetx: 0,
                    offsety: 0,
                    layerData: "2:0",
                },
                {
                    id: "nested-group",
                    parentId: "parent-group",
                    type: "group",
                    name: "Nested Group",
                    opacity: 1,
                    open: false,
                    visible: true,
                    locked: false,
                },
                {
                    id: "nested-tile",
                    parentId: "nested-group",
                    type: "tile",
                    name: "Nested Tile",
                    x: 0,
                    y: 0,
                    width: 1,
                    height: 1,
                    opacity: 1,
                    visible: true,
                    locked: false,
                    offsetx: 0,
                    offsety: 0,
                    layerData: "0:0",
                },
                {
                    id: "top-tile",
                    parentId: "root",
                    type: "tile",
                    name: "Top Tile",
                    x: 0,
                    y: 0,
                    width: 1,
                    height: 1,
                    opacity: 1,
                    visible: true,
                    locked: false,
                    offsetx: 0,
                    offsety: 0,
                    layerData: "0",
                },
            ],
        });

        const xml = exportXml(tilemap);
        const parsed = parser.parse(xml);

        expect(orderedChildIds(xml)).toEqual(["top-tile", "parent-group", "bottom-tile"]);
        expect(orderedChildIds(xml, "group", "parent-group")).toEqual(["nested-group", "child-tile"]);

        const parentGroup = parsed.map.group;
        expect(parentGroup).toEqual(expect.objectContaining({
            id: "parent-group",
            name: "Parent Group",
            visible: 0,
            locked: 1,
        }));
        expect(parentGroup.layer).toEqual(expect.objectContaining({
            id: "child-tile",
            visible: 0,
            locked: 1,
            data: { encoding: "csv", "#text": 3 },
        }));
        expect(parentGroup.group).toEqual(expect.objectContaining({
            id: "nested-group",
            visible: 0,
            locked: 1,
            layer: expect.objectContaining({
                id: "nested-tile",
                visible: 0,
                locked: 1,
                data: { encoding: "csv", "#text": 1 },
            }),
        }));
    });

    it("exports rule layer data after recalculating rule outputs", () => {
        const context = createReferenceContext({ rulesets: ["terrain-rule"] });
        registerLoadedTileset(context, createTilesetData({
            id: "terrain",
            name: "Terrain",
            columns: 4,
            rows: 1,
            tiles: [{ id: 0 }, { id: 1 }, { id: 2 }, { id: 3 }],
        }), "tilesets/terrain.json");

        const ruleset = new Ruleset(
            createRulesetData({
                id: "terrain-rule",
                name: "Terrain Rule",
                size: 3,
                tilesets: { refs: [{ index: 0, id: "terrain", name: "Terrain" }], nextIndex: 1 },
                rules: [{ id: "fallback", constraints: "", outputs: "2:0:1" }],
            }),
            context.filePathSystem,
            context.tilesetRefManager,
            context.rulesetRefManager,
        );
        registerLoadedRuleset(context.rulesetManager, ruleset);

        const tilemap = createTilemap(context, {
            tilesets: { refs: [{ index: 0, id: "terrain", name: "Terrain" }], nextIndex: 1 },
            rulesets: { refs: [{ index: 0, id: "terrain-rule", name: "Terrain Rule" }], nextIndex: 1 },
            layers: [{
                id: "rules",
                parentId: "root",
                type: "auto_rule",
                name: "Rules",
                x: 0,
                y: 0,
                width: 2,
                height: 2,
                opacity: 1,
                visible: true,
                locked: false,
                offsetx: 0,
                offsety: 0,
                layerData: "0:-1:-1,0\n0,0",
            }],
        });

        const parsed = exportParsed(tilemap);

        expect(parsed.map.layer).toEqual(expect.objectContaining({
            id: "rules",
            name: "Rules",
            data: {
                encoding: "csv",
                "#text": "3,0,0,0",
            },
        }));
    });

    it("exports unresolved tile and rule output tileset gids as zero", () => {
        const context = createReferenceContext({ rulesets: ["terrain-rule"] });
        registerLoadedTileset(context, createTilesetData({
            id: "terrain",
            name: "Terrain",
            columns: 2,
            rows: 1,
            tiles: [{ id: 0 }, { id: 1 }],
        }), "tilesets/terrain.json");

        const ruleset = new Ruleset(
            createRulesetData({
                id: "terrain-rule",
                name: "Terrain Rule",
                size: 3,
                tilesets: { refs: [{ index: 1, id: "missing-tileset", name: "Missing" }], nextIndex: 2 },
                rules: [{ id: "fallback", constraints: "", outputs: "7:1:1" }],
            }),
            context.filePathSystem,
            context.tilesetRefManager,
            context.rulesetRefManager,
        );
        registerLoadedRuleset(context.rulesetManager, ruleset);

        const tilemap = createTilemap(context, {
            tilesets: { refs: [{ index: 0, id: "terrain", name: "Terrain" }], nextIndex: 1 },
            rulesets: { refs: [{ index: 0, id: "terrain-rule", name: "Terrain Rule" }], nextIndex: 1 },
            layers: [
                {
                    id: "tiles",
                    parentId: "root",
                    type: "tile",
                    name: "Tiles",
                    x: 0,
                    y: 0,
                    width: 2,
                    height: 1,
                    opacity: 1,
                    visible: true,
                    locked: false,
                    offsetx: 0,
                    offsety: 0,
                    layerData: "1:0,4:9",
                },
                {
                    id: "rules",
                    parentId: "root",
                    type: "auto_rule",
                    name: "Rules",
                    x: 0,
                    y: 0,
                    width: 1,
                    height: 1,
                    opacity: 1,
                    visible: true,
                    locked: false,
                    offsetx: 0,
                    offsety: 0,
                    layerData: "0:-1:-1",
                },
            ],
        });

        const parsed = exportParsed(tilemap);
        const layers = asArray(parsed.map.layer);

        expect(layers.find((layer: any) => layer.id === "tiles").data["#text"]).toBe("2,0");
        expect(layers.find((layer: any) => layer.id === "rules").data["#text"]).toBe(0);
    });

    it("exports available tilesets and zeroes references to missing tilesets in partially resolvable maps", () => {
        const context = createReferenceContext();
        registerLoadedTileset(context, createTilesetData({
            id: "terrain",
            name: "Terrain",
            columns: 2,
            rows: 1,
            image: { source: "terrain.png", width: 32, height: 16 },
            tiles: [{ id: 0 }, { id: 1 }],
        }), "tilesets/terrain.json");

        const tilemap = createTilemap(context, {
            tilesets: {
                refs: [
                    { index: 0, id: "terrain", name: "Terrain" },
                    { index: 1, id: "missing-decor", name: "Missing Decor" },
                ],
                nextIndex: 2,
            },
            layers: [{
                id: "mixed",
                parentId: "root",
                type: "tile",
                name: "Mixed",
                x: 0,
                y: 0,
                width: 3,
                height: 1,
                opacity: 1,
                visible: true,
                locked: false,
                offsetx: 0,
                offsety: 0,
                layerData: "1:0,1:1,1:99",
            }],
        });

        const parsed = exportParsed(tilemap);

        expect(asArray(parsed.map.tileset)).toEqual([
            expect.objectContaining({ firstgid: 1, name: "Terrain", tilecount: 2 }),
        ]);
        expect(parsed.map.layer.data["#text"]).toBe("2,0,0");
    });
});
