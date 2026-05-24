import { describe, expect, it, vi } from "vitest";

import { TilemapSession } from "@/editor/session/tilemap.session";
import { Tilemap } from "@/editor/model/tilemap/tilemap";
import { TilemapData } from "@/shared/schema/tilemap.schema";
import { createReferenceContext, loadRulesetRefs, loadTilesetRefs } from "./editor-test-utils";

const createTilemap = () => {
    const context = createReferenceContext({ tilesets: ["tileset-a"], rulesets: ["ruleset-a"] });
    loadTilesetRefs(context.tilesetRefManager, ["tileset-a"]);
    loadRulesetRefs(context.rulesetRefManager, ["ruleset-a"]);

    const data: TilemapData = {
        id: "map-1",
        name: "Map One",
        orientation: "orthogonal",
        width: 4,
        height: 3,
        tilewidth: 16,
        tileheight: 16,
        backgroundcolor: "#11223344",
        tilesets: context.tilesetRefManager.serialize(),
        rulesets: context.rulesetRefManager.serialize(),
        layers: [
            {
                id: "tile-layer",
                type: "tile",
                name: "Ground",
                x: 0,
                y: 0,
                width: 4,
                height: 3,
                opacity: 1,
                visible: true,
                locked: false,
                offsetx: 0,
                offsety: 0,
                layerData: "0,0,0,0\n0,0,0,0\n0,0,0,0",
            },
        ],
    };

    return new Tilemap(data, context.filePathSystem, context.tilesetRefManager, context.rulesetRefManager);
};

describe("TilemapSession", () => {
    it("filters restored selected layers to layers that still exist", () => {
        const session = new TilemapSession(
            createTilemap(),
            {
                id: "session-1",
                tilemapId: "map-1",
                viewState: { x: 10, y: 20, zoom: 2 },
                layerState: { selectedLayers: ["missing-layer", "tile-layer"] },
            },
            { textureManager: { releaseTilesetGraphics: vi.fn() } } as any,
        );

        expect(session.layerState.selectedLayers).toEqual(["tile-layer"]);
        expect(session.viewState).toEqual({ x: 10, y: 20, zoom: 2 });
    });

    it("emits state changes when layer selection and dirty marks change", () => {
        const session = new TilemapSession(
            createTilemap(),
            { id: "session-1", tilemapId: "map-1" },
            { textureManager: { releaseTilesetGraphics: vi.fn() } } as any,
        );
        const selectedLayersChanged = vi.fn();
        const markChanged = vi.fn();
        session.on("onSelectedLayersChanged", selectedLayersChanged);
        session.on("onMarkChange", markChanged);

        session.updateViewState({ zoom: 3 });
        session.updateLayerState({ selectedLayers: ["tile-layer"] });
        session.markAsDirty();
        session.markAsClean();

        expect(session.viewState).toEqual({ x: null, y: null, zoom: 3 });
        expect(selectedLayersChanged).toHaveBeenCalledWith(["tile-layer"]);
        expect(markChanged).toHaveBeenNthCalledWith(1, true);
        expect(markChanged).toHaveBeenNthCalledWith(2, false);
    });

    it("serializes session state and releases retained tileset graphics on destroy", () => {
        const releaseTilesetGraphics = vi.fn();
        const session = new TilemapSession(
            createTilemap(),
            { id: "session-1", tilemapId: "map-1" },
            { textureManager: { releaseTilesetGraphics } } as any,
        );
        session.updateViewState({ x: 1, y: 2, zoom: 1.5 });
        session.updateLayerState({ selectedLayers: ["tile-layer"] });

        expect(session.serialize()).toEqual({
            id: "session-1",
            tilemapId: "map-1",
            viewState: { x: 1, y: 2, zoom: 1.5 },
            layerState: { selectedLayers: ["tile-layer"] },
        });

        session.destroy();

        expect(releaseTilesetGraphics).toHaveBeenCalledWith("tileset-a");
    });
});
