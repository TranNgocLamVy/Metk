import { describe, expect, it } from "vitest";

import { Tilemap } from "@/editor/model/tilemap/tilemap";
import { TilemapData } from "@/shared/data-types/tilemap.data";
import { createReferenceContext, loadRulesetRefs, loadTilesetRefs } from "./editor-test-utils";

const createTilemapData = (): TilemapData => ({
    id: "map-1",
    name: "Map One",
    orientation: "orthogonal",
    width: 2,
    height: 2,
    tilewidth: 16,
    tileheight: 16,
    backgroundcolor: "#00000000",
    tilesets: {
        refs: [{ index: 0, id: "tileset-a", name: "Tileset A" }],
        nextIndex: 1,
    },
    rulesets: {
        refs: [{ index: 0, id: "ruleset-a", name: "Ruleset A" }],
        nextIndex: 1,
    },
    layers: [
        {
            id: "tile-layer",
            type: "tile",
            name: "Ground",
            x: 0,
            y: 0,
            width: 2,
            height: 2,
            opacity: 1,
            visible: true,
            locked: false,
            offsetx: 0,
            offsety: 0,
            layerData: "4:0,0\n0,0",
        },
        {
            id: "rule-layer",
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
        },
    ],
});

const createTilemapModel = (tilemapData: unknown, context: ReturnType<typeof createReferenceContext>): Tilemap => {
    const result = Tilemap.create(tilemapData, context.filePathSystem, context.tilesetRefManager, context.rulesetRefManager);
    if (result.status !== "Success") throw new Error(String(result.message));
    return result.data;
};

describe("Tilemap", () => {
    it("serializes tilemap data with layer and reference state intact", () => {
        const context = createReferenceContext({ tilesets: ["tileset-a"], rulesets: ["ruleset-a"] });
        const tilemapData = createTilemapData();
        const tilemap = createTilemapModel(tilemapData, context);

        expect(tilemap.serialize()).toEqual(tilemapData);
    });

    it("checks map boundaries inclusively at zero and exclusively at dimensions", () => {
        const context = createReferenceContext();
        const tilemap = createTilemapModel(createTilemapData(), context);

        expect(tilemap.isInBoundary({ col: 0, row: 0 })).toBe(true);
        expect(tilemap.isInBoundary({ col: 1, row: 1 })).toBe(true);
        expect(tilemap.isInBoundary({ col: 2, row: 1 })).toBe(false);
        expect(tilemap.isInBoundary({ col: 1, row: -1 })).toBe(false);
    });

    it("removes tileset references and clears dependent tile outputs", () => {
        const context = createReferenceContext({ tilesets: ["tileset-a"], rulesets: ["ruleset-a"] });
        loadTilesetRefs(context.tilesetRefManager, ["tileset-a"]);
        loadRulesetRefs(context.rulesetRefManager, ["ruleset-a"]);
        const tilemap = createTilemapModel(createTilemapData(), context);

        expect(tilemap.removeTilesetRef("tileset-a")).toBe(true);

        expect(tilemap.serialize().tilesets.refs).toEqual([]);
        expect(tilemap.serialize().layers).toEqual([
            expect.objectContaining({ id: "tile-layer", layerData: "0,0\n0,0" }),
            expect.objectContaining({ id: "rule-layer", layerData: "0:-1:-1,0\n0,0" }),
        ]);
    });

    it("removes ruleset references and clears dependent rule cells", () => {
        const context = createReferenceContext({ tilesets: ["tileset-a"], rulesets: ["ruleset-a"] });
        const tilemap = createTilemapModel(createTilemapData(), context);

        expect(tilemap.removeRulesetRef("ruleset-a")).toBe(true);
        expect(tilemap.removeRulesetRef("missing-ruleset")).toBe(false);

        expect(tilemap.serialize().rulesets.refs).toEqual([]);
        expect(tilemap.serialize().layers).toContainEqual(expect.objectContaining({ id: "rule-layer", layerData: "0,0\n0,0" }));
    });

    it("creates from valid minimal tilemap data with defaults", () => {
        const context = createReferenceContext();
        const result = Tilemap.create(
            { id: "map-minimal" },
            context.filePathSystem,
            context.tilesetRefManager,
            context.rulesetRefManager,
        );

        expect(result.status).toBe("Success");
        if (result.status !== "Success") throw new Error("Expected tilemap creation to succeed");
        expect(result.data.serialize()).toMatchObject({
            id: "map-minimal",
            name: "Untitled Tilemap",
            orientation: "orthogonal",
            width: 64,
            height: 64,
            tilewidth: 16,
            tileheight: 16,
            backgroundcolor: "#00000000",
            layers: [],
        });
    });

    it("returns Result.Error when critical id is invalid", () => {
        const context = createReferenceContext();
        const result = Tilemap.create(
            { name: "Missing ID" },
            context.filePathSystem,
            context.tilesetRefManager,
            context.rulesetRefManager,
        );

        expect(result.status).toBe("Error");
        expect(typeof result.message === "string" ? result.message : result.message?.key).toContain("Failed to create tilemap");
    });

    it("defaults invalid orientation and size fields", () => {
        const context = createReferenceContext();
        const result = Tilemap.create(
            {
                id: "map-invalid-fields",
                orientation: "sideways",
                width: 0,
                height: Number.NaN,
                tilewidth: -1,
                tileheight: Infinity,
                layers: "not-layers",
            },
            context.filePathSystem,
            context.tilesetRefManager,
            context.rulesetRefManager,
        );

        expect(result.status).toBe("Success");
        if (result.status !== "Success") throw new Error("Expected tilemap creation to succeed");
        expect(result.data.serialize()).toMatchObject({
            orientation: "orthogonal",
            width: 64,
            height: 64,
            tilewidth: 16,
            tileheight: 16,
            layers: [],
        });
    });
});

