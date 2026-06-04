import { describe, expect, it, vi } from "vitest";

import { CreateTileLayerCommand } from "@/application/commands/layer/create-tile-layer.command";
import { DeleteLayerCommand } from "@/application/commands/layer/delete-layer.command";
import { MoveLayerCommand } from "@/application/commands/layer/move-layer.command";
import { UpdatePropertyCommand } from "@/application/commands/update-property.command";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { Tilemap } from "@/editor/model/tilemap/tilemap";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { TilemapSession } from "@/editor/session/tilemap.session";
import { TilemapData } from "@/shared/data-types/tilemap.data";
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
        tileWidth: 16,
        tileHeight: 16,
        backgroundcolor: "#11223344",
        tilesets: context.tilesetRefManager.serialize(),
        rulesets: context.rulesetRefManager.serialize(),
        entityCollections: context.entityCollectionRefManager.serialize(),
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
            {
                id: "rule-layer",
                type: "auto_rule",
                name: "Rules",
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

    const result = Tilemap.createFromFileData(
        data,
        context.filePathSystem,
        context.tilesetRefManager,
        context.rulesetRefManager,
        context.entityCollectionRefManager,
    );
    if (result.status !== "Success") throw new Error(String(result.message));
    return result.data;
};

const createTileLayerPayload = (id: string) => ({
    id,
    type: "tile" as const,
    name: id,
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
});

const flushMicrotasks = async () => {
    await Promise.resolve();
    await Promise.resolve();
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

    it("exposes the current project object registry as its command context", () => {
        const tilemap = createTilemap();
        const objectRegistry = new EditorObjectRegistry();
        objectRegistry.registerTree(tilemap);
        const session = new TilemapSession(
            tilemap,
            { id: "session-1", tilemapId: "map-1" },
            {
                currentProject: { objectRegistry },
                textureManager: { releaseTilesetGraphics: vi.fn() },
            } as any,
        );

        expect(session.objectRegistry).toBe(objectRegistry);
        expect(session.historyManager).toBeDefined();
    });

    it("throws when its command context is requested without a current project registry", () => {
        const session = new TilemapSession(
            createTilemap(),
            { id: "session-1", tilemapId: "map-1" },
            { currentProject: null, textureManager: { releaseTilesetGraphics: vi.fn() } } as any,
        );

        expect(() => session.objectRegistry).toThrow("TilemapSession objectRegistry is unavailable");
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

    it("marks layer changes for commit, undo, redo, and external layer property updates", () => {
        const tilemap = createTilemap();
        const objectRegistry = new EditorObjectRegistry();
        objectRegistry.registerTree(tilemap);
        const session = new TilemapSession(
            tilemap,
            { id: "session-1", tilemapId: "map-1" },
            {
                objectRegistry,
                textureManager: { releaseTilesetGraphics: vi.fn() },
            } as any,
        );
        const markAsDirty = vi.spyOn(session, "markAsDirty");
        const layer = tilemap.rootLayer.findLayer("tile-layer")!;
        const command = new UpdatePropertyCommand(layer.objectId, "name", layer.name, "Committed");

        command.execute({ objectRegistry } as any);
        command.undo({ objectRegistry } as any);
        command.redo({ objectRegistry } as any);
        layer.rename("External");

        expect(markAsDirty).toHaveBeenCalledTimes(4);
    });

    it("does not mark layer changes for preview property updates", () => {
        const tilemap = createTilemap();
        const session = new TilemapSession(
            tilemap,
            { id: "session-1", tilemapId: "map-1" },
            { textureManager: { releaseTilesetGraphics: vi.fn() } } as any,
        );
        const markAsDirty = vi.spyOn(session, "markAsDirty");
        const layer = tilemap.rootLayer.findLayer("tile-layer")!;

        layer.updateOpacity(0.5, {
            origin: "preview",
            source: "TilemapSession.test",
        });

        expect(markAsDirty).not.toHaveBeenCalled();
        expect(session.isDirty).toBeFalsy();
    });

    it("marks layer changes for tile and rule content model events", () => {
        const tilemap = createTilemap();
        const session = new TilemapSession(
            tilemap,
            { id: "session-1", tilemapId: "map-1" },
            { textureManager: { releaseTilesetGraphics: vi.fn() } } as any,
        );
        const markAsDirty = vi.spyOn(session, "markAsDirty");
        const tileLayer = tilemap.rootLayer.findLayer("tile-layer") as TileLayer;
        const ruleLayer = tilemap.rootLayer.findLayer("rule-layer") as RuleLayer;

        tileLayer.setTilesAt([
            { coordinate: { col: 0, row: 0 }, tileId: 1, tilesetId: "tileset-a" },
        ]);
        ruleLayer.setRuleRefsAt([
            { coordinate: { col: 0, row: 0 }, rulesetId: "ruleset-a" },
        ]);

        expect(markAsDirty).toHaveBeenCalledTimes(2);
    });

    it("refreshes subscriptions when layers are added, removed, or reordered", () => {
        const tilemap = createTilemap();
        const session = new TilemapSession(
            tilemap,
            { id: "session-1", tilemapId: "map-1" },
            { textureManager: { releaseTilesetGraphics: vi.fn() } } as any,
        );
        const markAsDirty = vi.spyOn(session, "markAsDirty");
        const newLayer = new TileLayer(
            {
                id: "added-layer",
                type: "tile",
                name: "Added",
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
            tilemap.rootLayer,
            tilemap,
            tilemap.objectId,
        );

        tilemap.rootLayer.pushLayer(newLayer);
        expect(markAsDirty).toHaveBeenCalledTimes(1);

        newLayer.rename("Added Renamed");
        expect(markAsDirty).toHaveBeenCalledTimes(2);

        tilemap.rootLayer.moveChild("added-layer", -1);
        expect(markAsDirty).toHaveBeenCalledTimes(3);

        tilemap.rootLayer.removeLayer("added-layer");
        expect(markAsDirty).toHaveBeenCalledTimes(4);

        newLayer.rename("Removed Renamed");
        expect(markAsDirty).toHaveBeenCalledTimes(4);
    });

    it("marks layer changes when layer commands create, delete, and move layers", async () => {
        const tilemap = createTilemap();
        const objectRegistry = new EditorObjectRegistry();
        objectRegistry.registerTree(tilemap);
        const session = new TilemapSession(
            tilemap,
            { id: "session-1", tilemapId: "map-1" },
            {
                objectRegistry,
                textureManager: { releaseTilesetGraphics: vi.fn() },
            } as any,
        );
        const markAsDirty = vi.spyOn(session, "markAsDirty");
        const editorFacade = { objectRegistry } as any;
        const createCommand = new CreateTileLayerCommand(
            tilemap.objectId,
            tilemap.rootLayer.objectId,
            createTileLayerPayload("created-layer"),
        );

        expect(createCommand.execute(editorFacade).status).toBe("Success");
        expect(markAsDirty).toHaveBeenCalledTimes(1);

        const moveCommand = new MoveLayerCommand(
            tilemap.objectId,
            tilemap.rootLayer.objectId,
            tilemap.rootLayer.findLayer("created-layer")!.objectId,
            1,
        );

        expect(moveCommand.execute(editorFacade).status).toBe("Success");
        expect(markAsDirty).toHaveBeenCalledTimes(3);

        const deleteCommand = new DeleteLayerCommand(
            tilemap.objectId,
            tilemap.rootLayer.findLayer("created-layer")!.objectId,
        );

        expect(deleteCommand.execute(editorFacade).status).toBe("Success");
        expect(markAsDirty).toHaveBeenCalledTimes(4);
        await flushMicrotasks();
    });

    it("removes deleted layers from selected layer state through the observer", async () => {
        const tilemap = createTilemap();
        const objectRegistry = new EditorObjectRegistry();
        objectRegistry.registerTree(tilemap);
        const session = new TilemapSession(
            tilemap,
            {
                id: "session-1",
                tilemapId: "map-1",
                layerState: { selectedLayers: ["tile-layer"] },
            },
            {
                objectRegistry,
                textureManager: { releaseTilesetGraphics: vi.fn() },
            } as any,
        );
        const selectedLayersChanged = vi.fn();
        session.on("onSelectedLayersChanged", selectedLayersChanged);

        const command = new DeleteLayerCommand(
            tilemap.objectId,
            tilemap.rootLayer.findLayer("tile-layer")!.objectId,
        );

        expect(command.execute({ objectRegistry } as any).status).toBe("Success");
        await flushMicrotasks();

        expect(session.layerState.selectedLayers).toEqual([]);
        expect(selectedLayersChanged).toHaveBeenCalledWith([]);
    });

    it("keeps selected layer state intact when a selected layer is moved", async () => {
        const tilemap = createTilemap();
        const extraLayer = new TileLayer(
            createTileLayerPayload("second-layer"),
            tilemap.rootLayer,
            tilemap,
            tilemap.objectId,
        );
        tilemap.rootLayer.pushLayer(extraLayer);

        const objectRegistry = new EditorObjectRegistry();
        objectRegistry.registerTree(tilemap);
        const session = new TilemapSession(
            tilemap,
            {
                id: "session-1",
                tilemapId: "map-1",
                layerState: { selectedLayers: ["tile-layer"] },
            },
            {
                objectRegistry,
                textureManager: { releaseTilesetGraphics: vi.fn() },
            } as any,
        );
        const selectedLayersChanged = vi.fn();
        session.on("onSelectedLayersChanged", selectedLayersChanged);

        const command = new MoveLayerCommand(
            tilemap.objectId,
            tilemap.rootLayer.objectId,
            tilemap.rootLayer.findLayer("tile-layer")!.objectId,
            1,
        );

        expect(command.execute({ objectRegistry } as any).status).toBe("Success");
        await flushMicrotasks();

        expect(session.layerState.selectedLayers).toEqual(["tile-layer"]);
        expect(selectedLayersChanged).not.toHaveBeenCalled();
    });

    it("removes observer listeners on destroy", () => {
        const releaseTilesetGraphics = vi.fn();
        const tilemap = createTilemap();
        const session = new TilemapSession(
            tilemap,
            { id: "session-1", tilemapId: "map-1" },
            { textureManager: { releaseTilesetGraphics } } as any,
        );
        const markAsDirty = vi.spyOn(session, "markAsDirty");
        const layer = tilemap.rootLayer.findLayer("tile-layer")!;

        session.destroy();
        layer.rename("After Destroy");

        expect(markAsDirty).not.toHaveBeenCalled();
        expect(releaseTilesetGraphics).toHaveBeenCalledWith("tileset-a");
    });
});
