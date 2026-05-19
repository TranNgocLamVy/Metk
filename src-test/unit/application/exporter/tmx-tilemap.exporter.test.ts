import { XMLParser } from "fast-xml-parser";
import { describe, expect, it } from "vitest";

import { TmxTilemapExporter } from "@/application/exporter/tmx-tilemap.exporter";
import { FilePathSystem } from "@/infrastructure/project-path-system";
import { Tilemap } from "@/editor/model/tilemap/tilemap";
import { Tileset } from "@/editor/model/tileset/tileset";
import { TilemapData } from "@/shared/schema/tilemap.schema";
import { TilesetData } from "@/shared/schema/tileset.schema";
import { createReferenceContext } from "../../editor/editor-test-utils";

const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "",
    parseAttributeValue: true,
    trimValues: true,
});

const decode = (bytes: Uint8Array) => new TextDecoder().decode(bytes);

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
});
