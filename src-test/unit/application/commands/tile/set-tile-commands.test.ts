import { describe, expect, it, vi } from "vitest";

import { SetRulesCommand } from "@/application/commands/tile/set-rules.command";
import { SetTilesCommand } from "@/application/commands/tile/set-tiles.command";
import { EditorFacade } from "@/application/editor.facade";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { Tilemap } from "@/editor/model/tilemap/tilemap";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/project-path-system";
import { RuleLayerData, RootLayerData, TileLayerData } from "@/shared/schema/layer.schema";
import { TilemapData } from "@/shared/schema/tilemap.schema";

import { createReferenceContext } from "../../../editor/editor-test-utils";

type TestTilemapSession = {
    tilemap: Tilemap;
    isDirty: boolean;
    markAsDirty: ReturnType<typeof vi.fn>;
};

const createTileLayerData = (overrides: Partial<TileLayerData> = {}): TileLayerData => ({
    id: "tile-layer",
    type: "tile",
    name: "Ground",
    x: 0,
    y: 0,
    width: 3,
    height: 3,
    opacity: 1,
    visible: true,
    locked: false,
    offsetx: 0,
    offsety: 0,
    layerData: "1:0,0,0\n0,2:1,0\n0,0,0",
    ...overrides,
});

const createRuleLayerData = (overrides: Partial<RuleLayerData> = {}): RuleLayerData => ({
    id: "rule-layer",
    type: "auto_rule",
    name: "Auto Rules",
    x: 0,
    y: 0,
    width: 3,
    height: 3,
    opacity: 1,
    visible: true,
    locked: false,
    offsetx: 0,
    offsety: 0,
    layerData: "0:-1:-1,0,0\n0,1:-1:-1,0\n0,0,0",
    ...overrides,
});

const createCommandHarness = (layers: RootLayerData = [createTileLayerData(), createRuleLayerData()]) => {
    const referenceContext = createReferenceContext({
        tilesets: ["tileset-a", "tileset-b"],
        rulesets: ["ruleset-a", "ruleset-b"],
        fileId: "tilemap-a",
        relPath: "tilemaps/tilemap-a.json",
    });
    const projectPathSystem = new ProjectPathSystem("C:/Project/Metk/tile-command-test");
    const filePathSystem = new FilePathSystem("tilemap-a", projectPathSystem, "tilemaps/tilemap-a.json");
    const tilemapData: TilemapData = {
        id: "tilemap-a",
        name: "Tile Command Map",
        orientation: "orthogonal",
        width: 3,
        height: 3,
        tilewidth: 16,
        tileheight: 16,
        backgroundcolor: "#00000000",
        tilesets: {
            refs: [
                { id: "tileset-a", index: 0, name: "Tileset A" },
                { id: "tileset-b", index: 1, name: "Tileset B" },
            ],
            nextIndex: 2,
        },
        rulesets: {
            refs: [
                { id: "ruleset-a", index: 0, name: "Ruleset A" },
                { id: "ruleset-b", index: 1, name: "Ruleset B" },
            ],
            nextIndex: 2,
        },
        layers,
    };
    const tilemap = new Tilemap(
        tilemapData,
        filePathSystem,
        referenceContext.tilesetRefManager,
        referenceContext.rulesetRefManager,
    );
    const objectRegistry = new EditorObjectRegistry();
    objectRegistry.registerTree(tilemap);

    const session: TestTilemapSession = {
        tilemap,
        isDirty: false,
        markAsDirty: vi.fn(() => {
            session.isDirty = true;
        }),
    };
    const tilemapSessionManager = {
        getSessionByTilemapId: vi.fn(() => session),
    };
    const editorFacade = {
        objectRegistry,
        currentWorkspace: { tilemapSessionManager },
    } as unknown as EditorFacade;

    return {
        tilemap,
        session,
        editorFacade,
        tileLayer: tilemap.rootLayer.findLayer("tile-layer") as TileLayer,
        ruleLayer: tilemap.rootLayer.findLayer("rule-layer") as RuleLayer,
    };
};

const createNoSessionFacade = () => ({
    objectRegistry: new EditorObjectRegistry(),
}) as unknown as EditorFacade;

describe("SetTilesCommand", () => {
    it("sets a single tile and undo restores the exact previous empty cell", () => {
        const { editorFacade, tilemap, session, tileLayer } = createCommandHarness();
        const command = new SetTilesCommand(tilemap.objectId, tileLayer.objectId, [
            { coordinate: { col: 2, row: 0 }, tileId: 7, tilesetId: "tileset-b" },
        ]);

        expect(tileLayer.getTileRefAt({ col: 2, row: 0 })).toBeNull();

        expect(command.execute(editorFacade)).toEqual({
            status: "Success",
            data: [{ coordinate: { col: 2, row: 0 }, tileId: null, tilesetId: null }],
        });
        expect(tileLayer.getTileRefAt({ col: 2, row: 0 })).toEqual({ tileId: 7, tilesetId: "tileset-b" });
        expect(session.markAsDirty).not.toHaveBeenCalled();

        expect(command.undo(editorFacade)).toEqual({
            status: "Success",
            data: [{ coordinate: { col: 2, row: 0 }, tileId: 7, tilesetId: "tileset-b" }],
        });
        expect(tileLayer.getTileRefAt({ col: 2, row: 0 })).toBeNull();
        expect(session.markAsDirty).not.toHaveBeenCalled();
    });

    it("sets multiple tiles and undo restores each previous tile reference", () => {
        const { editorFacade, tilemap, tileLayer } = createCommandHarness();
        const command = new SetTilesCommand(tilemap.objectId, tileLayer.objectId, [
            { coordinate: { col: 0, row: 0 }, tileId: 5, tilesetId: "tileset-b" },
            { coordinate: { col: 1, row: 1 }, tileId: null, tilesetId: null },
            { coordinate: { col: 2, row: 2 }, tileId: 9, tilesetId: "tileset-a" },
        ]);

        expect(tileLayer.getTileRefAt({ col: 0, row: 0 })).toEqual({ tileId: 1, tilesetId: "tileset-a" });
        expect(tileLayer.getTileRefAt({ col: 1, row: 1 })).toEqual({ tileId: 2, tilesetId: "tileset-b" });
        expect(tileLayer.getTileRefAt({ col: 2, row: 2 })).toBeNull();

        expect(command.execute(editorFacade).status).toBe("Success");
        expect(tileLayer.getTileRefAt({ col: 0, row: 0 })).toEqual({ tileId: 5, tilesetId: "tileset-b" });
        expect(tileLayer.getTileRefAt({ col: 1, row: 1 })).toBeNull();
        expect(tileLayer.getTileRefAt({ col: 2, row: 2 })).toEqual({ tileId: 9, tilesetId: "tileset-a" });

        expect(command.undo(editorFacade).status).toBe("Success");
        expect(tileLayer.getTileRefAt({ col: 0, row: 0 })).toEqual({ tileId: 1, tilesetId: "tileset-a" });
        expect(tileLayer.getTileRefAt({ col: 1, row: 1 })).toEqual({ tileId: 2, tilesetId: "tileset-b" });
        expect(tileLayer.getTileRefAt({ col: 2, row: 2 })).toBeNull();
    });

    it("undo restores the state before a repeated edit to the same cell", () => {
        const { editorFacade, tilemap, tileLayer } = createCommandHarness();
        const firstCommand = new SetTilesCommand(tilemap.objectId, tileLayer.objectId, [
            { coordinate: { col: 0, row: 0 }, tileId: 3, tilesetId: "tileset-a" },
        ]);
        const secondCommand = new SetTilesCommand(tilemap.objectId, tileLayer.objectId, [
            { coordinate: { col: 0, row: 0 }, tileId: 4, tilesetId: "tileset-b" },
        ]);

        firstCommand.execute(editorFacade);
        expect(tileLayer.getTileRefAt({ col: 0, row: 0 })).toEqual({ tileId: 3, tilesetId: "tileset-a" });

        secondCommand.execute(editorFacade);
        expect(tileLayer.getTileRefAt({ col: 0, row: 0 })).toEqual({ tileId: 4, tilesetId: "tileset-b" });

        secondCommand.undo(editorFacade);
        expect(tileLayer.getTileRefAt({ col: 0, row: 0 })).toEqual({ tileId: 3, tilesetId: "tileset-a" });

        firstCommand.undo(editorFacade);
        expect(tileLayer.getTileRefAt({ col: 0, row: 0 })).toEqual({ tileId: 1, tilesetId: "tileset-a" });
    });

    it("returns errors for missing sessions, missing layers, and non-tile target layers", () => {
        const { editorFacade, tilemap, tileLayer, ruleLayer } = createCommandHarness();
        const payload = [{ coordinate: { col: 0, row: 0 }, tileId: 5, tilesetId: "tileset-a" }];

        expect(new SetTilesCommand("tilemap:missing", "tilemap:missing:layer:tile-layer", payload).execute(createNoSessionFacade())).toMatchObject({
            status: "Error",
            message: { key: "Tilemap not found" },
        });
        expect(new SetTilesCommand(tilemap.objectId, `${tilemap.objectId}:layer:missing-layer`, payload).execute(editorFacade)).toMatchObject({
            status: "Error",
            message: { key: "Layer not found" },
        });
        expect(new SetTilesCommand(tilemap.objectId, ruleLayer.objectId, payload).execute(editorFacade)).toMatchObject({
            status: "Error",
            message: { key: "Layer is not a tile layer" },
        });
        expect(tileLayer.getTileRefAt({ col: 0, row: 0 })).toEqual({ tileId: 1, tilesetId: "tileset-a" });
    });

    it("cancels empty or invalid tile payloads and undo remains a no-op", () => {
        const { editorFacade, tilemap, session, tileLayer } = createCommandHarness();
        const command = new SetTilesCommand(tilemap.objectId, tileLayer.objectId, [
            { coordinate: { col: 99, row: 0 }, tileId: 5, tilesetId: "tileset-a" },
            { coordinate: { col: 0, row: 0 }, tileId: 5, tilesetId: "missing-tileset" },
        ]);
        const emptyCommand = new SetTilesCommand(tilemap.objectId, tileLayer.objectId, []);

        expect(command.execute(editorFacade)).toMatchObject({
            status: "Cancel",
            message: { key: "No tile changed" },
        });
        expect(emptyCommand.execute(editorFacade)).toMatchObject({
            status: "Cancel",
            message: { key: "No tile changed" },
        });
        expect(command.undo(editorFacade)).toMatchObject({
            status: "Cancel",
            message: { key: "No tile changed" },
        });
        expect(tileLayer.getTileRefAt({ col: 0, row: 0 })).toEqual({ tileId: 1, tilesetId: "tileset-a" });
        expect(session.markAsDirty).not.toHaveBeenCalled();
    });
});

describe("SetRulesCommand", () => {
    it("sets a single rule reference and undo restores the exact previous empty cell", () => {
        const { editorFacade, tilemap, session, ruleLayer } = createCommandHarness();
        const command = new SetRulesCommand(tilemap.objectId, ruleLayer.objectId, [
            { coordinate: { col: 2, row: 0 }, rulesetId: "ruleset-a" },
        ]);

        expect(ruleLayer.getRulesetRefAt({ col: 2, row: 0 })).toBeNull();

        expect(command.execute(editorFacade)).toEqual({
            status: "Success",
            data: [{ coordinate: { col: 2, row: 0 }, oldRulesetId: null }],
        });
        expect(ruleLayer.getRulesetRefAt({ col: 2, row: 0 })).toEqual({ rulesetId: "ruleset-a" });
        expect(session.markAsDirty).not.toHaveBeenCalled();

        expect(command.undo(editorFacade)).toEqual({
            status: "Success",
            data: [{ coordinate: { col: 2, row: 0 }, oldRulesetId: "ruleset-a" }],
        });
        expect(ruleLayer.getRulesetRefAt({ col: 2, row: 0 })).toBeNull();
        expect(session.markAsDirty).not.toHaveBeenCalled();
    });

    it("sets multiple rule references and undo restores prior rule ids exactly", () => {
        const { editorFacade, tilemap, ruleLayer } = createCommandHarness();
        const command = new SetRulesCommand(tilemap.objectId, ruleLayer.objectId, [
            { coordinate: { col: 0, row: 0 }, rulesetId: "ruleset-b" },
            { coordinate: { col: 1, row: 1 }, rulesetId: null },
            { coordinate: { col: 2, row: 2 }, rulesetId: "ruleset-a" },
        ]);

        expect(ruleLayer.getRulesetRefAt({ col: 0, row: 0 })).toEqual({ rulesetId: "ruleset-a" });
        expect(ruleLayer.getRulesetRefAt({ col: 1, row: 1 })).toEqual({ rulesetId: "ruleset-b" });
        expect(ruleLayer.getRulesetRefAt({ col: 2, row: 2 })).toBeNull();

        expect(command.execute(editorFacade).status).toBe("Success");
        expect(ruleLayer.getRulesetRefAt({ col: 0, row: 0 })).toEqual({ rulesetId: "ruleset-b" });
        expect(ruleLayer.getRulesetRefAt({ col: 1, row: 1 })).toBeNull();
        expect(ruleLayer.getRulesetRefAt({ col: 2, row: 2 })).toEqual({ rulesetId: "ruleset-a" });

        expect(command.undo(editorFacade).status).toBe("Success");
        expect(ruleLayer.getRulesetRefAt({ col: 0, row: 0 })).toEqual({ rulesetId: "ruleset-a" });
        expect(ruleLayer.getRulesetRefAt({ col: 1, row: 1 })).toEqual({ rulesetId: "ruleset-b" });
        expect(ruleLayer.getRulesetRefAt({ col: 2, row: 2 })).toBeNull();
    });

    it("undo restores the state before a repeated edit to the same rule cell", () => {
        const { editorFacade, tilemap, ruleLayer } = createCommandHarness();
        const firstCommand = new SetRulesCommand(tilemap.objectId, ruleLayer.objectId, [
            { coordinate: { col: 0, row: 0 }, rulesetId: "ruleset-b" },
        ]);
        const secondCommand = new SetRulesCommand(tilemap.objectId, ruleLayer.objectId, [
            { coordinate: { col: 0, row: 0 }, rulesetId: null },
        ]);

        firstCommand.execute(editorFacade);
        expect(ruleLayer.getRulesetRefAt({ col: 0, row: 0 })).toEqual({ rulesetId: "ruleset-b" });

        secondCommand.execute(editorFacade);
        expect(ruleLayer.getRulesetRefAt({ col: 0, row: 0 })).toBeNull();

        secondCommand.undo(editorFacade);
        expect(ruleLayer.getRulesetRefAt({ col: 0, row: 0 })).toEqual({ rulesetId: "ruleset-b" });

        firstCommand.undo(editorFacade);
        expect(ruleLayer.getRulesetRefAt({ col: 0, row: 0 })).toEqual({ rulesetId: "ruleset-a" });
    });

    it("returns errors for missing sessions, missing layers, and non-rule target layers", () => {
        const { editorFacade, tilemap, tileLayer, ruleLayer } = createCommandHarness();
        const payload = [{ coordinate: { col: 0, row: 0 }, rulesetId: "ruleset-a" }];

        expect(new SetRulesCommand("tilemap:missing", "tilemap:missing:layer:rule-layer", payload).execute(createNoSessionFacade())).toMatchObject({
            status: "Error",
            message: { key: "Tilemap not found" },
        });
        expect(new SetRulesCommand(tilemap.objectId, `${tilemap.objectId}:layer:missing-layer`, payload).execute(editorFacade)).toMatchObject({
            status: "Error",
            message: { key: "Layer not found" },
        });
        expect(new SetRulesCommand(tilemap.objectId, tileLayer.objectId, payload).execute(editorFacade)).toMatchObject({
            status: "Error",
            message: { key: "Layer is not a rule layer" },
        });
        expect(ruleLayer.getRulesetRefAt({ col: 0, row: 0 })).toEqual({ rulesetId: "ruleset-a" });
    });

    it("leaves cells unchanged for invalid rule updates while preserving undo safety", () => {
        const { editorFacade, tilemap, ruleLayer, session } = createCommandHarness();
        const command = new SetRulesCommand(tilemap.objectId, ruleLayer.objectId, [
            { coordinate: { col: 99, row: 0 }, rulesetId: "ruleset-a" },
            { coordinate: { col: 0, row: 2 }, rulesetId: "missing-ruleset" },
        ]);

        expect(command.execute(editorFacade)).toEqual({
            status: "Success",
            data: [{ coordinate: { col: 0, row: 2 }, oldRulesetId: null }],
        });
        expect(ruleLayer.getRulesetRefAt({ col: 0, row: 2 })).toBeNull();

        expect(command.undo(editorFacade)).toEqual({
            status: "Success",
            data: [{ coordinate: { col: 0, row: 2 }, oldRulesetId: null }],
        });
        expect(ruleLayer.getRulesetRefAt({ col: 0, row: 2 })).toBeNull();
        expect(session.markAsDirty).not.toHaveBeenCalled();
    });

    it("allows empty rule payloads without cell changes and cancels undo", () => {
        const { editorFacade, tilemap, ruleLayer, session } = createCommandHarness();
        const emptyCommand = new SetRulesCommand(tilemap.objectId, ruleLayer.objectId, []);

        expect(emptyCommand.execute(editorFacade)).toEqual({ status: "Success", data: [] });
        expect(emptyCommand.undo(editorFacade)).toMatchObject({
            status: "Cancel",
            message: { key: "No rule changed" },
        });
        expect(ruleLayer.getRulesetRefAt({ col: 0, row: 0 })).toEqual({ rulesetId: "ruleset-a" });
        expect(session.markAsDirty).not.toHaveBeenCalled();
    });
});
