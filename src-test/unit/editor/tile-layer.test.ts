import { describe, expect, it, vi } from "vitest";

import { RootLayer } from "@/editor/model/tilemap/layer/root-layer";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { TileLayerData } from "@/shared/schema/layer.schema";
import { createReferenceContext, createTilemap, loadTilesetRefs } from "./editor-test-utils";

const createTileLayer = (overrides: Partial<TileLayerData> = {}) => {
    const context = createReferenceContext({ tilesets: ["tileset-a", "tileset-b"] });
    loadTilesetRefs(context.tilesetRefManager, ["tileset-a", "tileset-b"]);
    const tilemap = createTilemap(context);
    const parent = new RootLayer([], tilemap);
    const data: TileLayerData = {
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
        layerData: "1:0,0\nbad,2:1",
        ...overrides,
    };

    return {
        layer: new TileLayer(data, parent, tilemap),
        context,
    };
};

describe("TileLayer", () => {
    it("parses tile references and returns public tileset ids for valid coordinates", () => {
        const { layer } = createTileLayer();

        expect(layer.getTileRefAt({ col: 0, row: 0 })).toEqual({ tileId: 1, tilesetId: "tileset-a" });
        expect(layer.getTileRefAt({ col: 1, row: 1 })).toEqual({ tileId: 2, tilesetId: "tileset-b" });
        expect(layer.getTileRefAt({ col: 0, row: 1 })).toBeNull();
        expect(layer.getTileRefAt({ col: -1, row: 0 })).toBeNull();
        expect(layer.getTileRefAt({ col: 2, row: 0 })).toBeNull();
    });

    it("sets, replaces, and removes tiles while returning previous tile data", () => {
        const { layer } = createTileLayer({ layerData: "0,0\n0,0" });
        const tilesChanged = vi.fn();
        layer.eventEmitter.on("tilesChanged", tilesChanged);

        const firstSet = layer.setTilesAt([{ coordinate: { col: 1, row: 0 }, tileId: 5, tilesetId: "tileset-a" }]);
        expect(firstSet).toEqual({
            status: "Success",
            data: [{ coordinate: { col: 1, row: 0 }, tileId: null, tilesetId: null }],
        });
        expect(layer.getTileRefAt({ col: 1, row: 0 })).toEqual({ tileId: 5, tilesetId: "tileset-a" });

        const replacement = layer.setTilesAt([{ coordinate: { col: 1, row: 0 }, tileId: 9, tilesetId: "tileset-b" }]);
        expect(replacement).toEqual({
            status: "Success",
            data: [{ coordinate: { col: 1, row: 0 }, tileId: 5, tilesetId: "tileset-a" }],
        });

        const removal = layer.setTilesAt([{ coordinate: { col: 1, row: 0 }, tileId: null, tilesetId: null }]);
        expect(removal).toEqual({
            status: "Success",
            data: [{ coordinate: { col: 1, row: 0 }, tileId: 9, tilesetId: "tileset-b" }],
        });
        expect(layer.getTileRefAt({ col: 1, row: 0 })).toBeNull();
        expect(tilesChanged).toHaveBeenCalledTimes(3);
    });

    it("cancels tile updates when no coordinate can be changed", () => {
        const { layer } = createTileLayer({ layerData: "0,0\n0,0" });

        expect(layer.setTilesAt([
            { coordinate: { col: 4, row: 0 }, tileId: 1, tilesetId: "tileset-a" },
            { coordinate: { col: 0, row: 0 }, tileId: 1, tilesetId: "missing-tileset" },
        ])).toMatchObject({
            status: "Cancel",
            message: { key: "No tile changed" },
        });
    });

    it("serializes layer data after transformations and clears removed tileset references", () => {
        const { layer } = createTileLayer();

        layer.setTilesAt([{ coordinate: { col: 1, row: 0 }, tileId: 5, tilesetId: "tileset-a" }]);
        layer.removeTilesetRef(0);

        expect(layer.serialize()).toEqual(expect.objectContaining({
            id: "tile-layer",
            type: "tile",
            layerData: "0,0\n0,2:1",
        }));
    });
});
