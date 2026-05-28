import { describe, expect, it } from "vitest";

import { CreateGroupLayerCommand } from "@/application/commands/layer/create-group-layer.command";
import { CreateRuleLayerCommand } from "@/application/commands/layer/create-rule-layer.command";
import { CreateTileLayerCommand } from "@/application/commands/layer/create-tile-layer.command";
import { GroupLayer } from "@/editor/model/tilemap/layer/group-layer";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";
import { TileLayer } from "@/editor/model/tilemap/layer/tile-layer";
import { Result } from "@/shared/types/result";

import {
    createGroupLayerData,
    createLayerCommandHarness,
    createNoSessionFacade,
    createRuleLayerData,
    createTileLayerData,
    layerObjectId,
    layerIds,
    requireGroupLayer,
} from "./layer-command-test-utils";

describe("CreateTileLayerCommand", () => {
    it("creates a tile layer in a group parent, opens the group, and removes it on undo", () => {
        const { editorFacade, tilemap, root, markLayerChange, objectRegistry } = createLayerCommandHarness();
        const group = requireGroupLayer(root, "group-a");
        const command = new CreateTileLayerCommand(tilemap.objectId, group.objectId, createTileLayerData({ id: "created-tile", name: "Decoration" }));

        const executeResult = command.execute(editorFacade);

        expect(executeResult.status).toBe(Result.Status.Success);
        const createdLayer = root.findLayer("created-tile");
        expect(createdLayer).toBeInstanceOf(TileLayer);
        expect(createdLayer?.parentLayer.id).toBe("group-a");
        expect(objectRegistry.has(createdLayer!.objectId)).toBe(true);
        expect(layerIds(group)[0]).toBe("created-tile");
        expect(group.isOpen).toBe(true);
        expect(markLayerChange).not.toHaveBeenCalled();

        const undoResult = command.undo(editorFacade);

        expect(undoResult.status).toBe(Result.Status.Success);
        expect(root.findLayer("created-tile")).toBeNull();
        expect(objectRegistry.has(createdLayer!.objectId)).toBe(false);
        expect(createdLayer!.destroyed).toBe(true);
        expect(layerIds(group)).toEqual(["group-child", "tile-a"]);
        expect(markLayerChange).not.toHaveBeenCalled();

        expect(command.execute(editorFacade).status).toBe(Result.Status.Success);
        const recreatedLayer = root.findLayer("created-tile");
        expect(recreatedLayer?.objectId).toBe(createdLayer!.objectId);
        expect(objectRegistry.has(createdLayer!.objectId)).toBe(true);
        expect(markLayerChange).not.toHaveBeenCalled();
    });

    it("creates a tile layer beside a non-group target by using that target's parent", () => {
        const { editorFacade, tilemap, root } = createLayerCommandHarness();
        const group = requireGroupLayer(root, "group-a");
        const command = new CreateTileLayerCommand(tilemap.objectId, layerObjectId(root, "tile-a"), createTileLayerData({ id: "sibling-tile" }));

        expect(command.execute(editorFacade).status).toBe(Result.Status.Success);

        expect(root.findLayer("sibling-tile")?.parentLayer.id).toBe("group-a");
        expect(layerIds(group)[0]).toBe("sibling-tile");
    });

    it("runs headlessly with only an object registry", () => {
        const { tilemap, root, objectRegistry } = createLayerCommandHarness();
        const command = new CreateTileLayerCommand(tilemap.objectId, root.objectId, createTileLayerData({ id: "headless-tile" }));

        expect(command.execute({ objectRegistry } as any).status).toBe(Result.Status.Success);

        expect(root.findLayer("headless-tile")).toBeInstanceOf(TileLayer);
    });

    it("returns an error when there is no active tilemap session", () => {
        const command = new CreateTileLayerCommand("tilemap:missing", "tilemap:missing:layer:root", createTileLayerData());

        expect(command.execute(createNoSessionFacade())).toMatchObject({
            status: Result.Status.Error,
            message: { key: "Tilemap not found" },
        });
    });
});

describe("CreateRuleLayerCommand", () => {
    it("creates a rule layer at the root and removes it on undo", () => {
        const { editorFacade, tilemap, root, markLayerChange } = createLayerCommandHarness();
        const command = new CreateRuleLayerCommand(tilemap.objectId, root.objectId, createRuleLayerData({ id: "created-rule", name: "Auto Terrain" }));

        expect(command.execute(editorFacade).status).toBe(Result.Status.Success);

        const createdLayer = root.findLayer("created-rule");
        expect(createdLayer).toBeInstanceOf(RuleLayer);
        expect(createdLayer?.parentLayer.id).toBe("root");
        expect(layerIds(root)[0]).toBe("created-rule");

        expect(command.undo(editorFacade).status).toBe(Result.Status.Success);
        expect(root.findLayer("created-rule")).toBeNull();
        expect(markLayerChange).not.toHaveBeenCalled();
    });

    it("returns an error when undo runs without an active tilemap session", () => {
        const command = new CreateRuleLayerCommand("tilemap:missing", "tilemap:missing:layer:root", createRuleLayerData());

        expect(command.undo(createNoSessionFacade())).toMatchObject({
            status: Result.Status.Error,
            message: { key: "Tilemap not found" },
        });
    });
});

describe("CreateGroupLayerCommand", () => {
    it("creates a group layer in the target group and removes it on undo", () => {
        const { editorFacade, tilemap, root } = createLayerCommandHarness();
        const group = requireGroupLayer(root, "group-a");
        const command = new CreateGroupLayerCommand(tilemap.objectId, group.objectId, createGroupLayerData({ id: "created-group", name: "Props" }));

        expect(command.execute(editorFacade).status).toBe(Result.Status.Success);

        const createdLayer = root.findLayer("created-group");
        expect(createdLayer).toBeInstanceOf(GroupLayer);
        expect(createdLayer?.parentLayer.id).toBe("group-a");
        expect(layerIds(group)[0]).toBe("created-group");
        expect(group.isOpen).toBe(true);

        expect(command.undo(editorFacade).status).toBe(Result.Status.Success);
        expect(root.findLayer("created-group")).toBeNull();
    });

    it("creates a group beside a non-group target by using that target's parent", () => {
        const { editorFacade, tilemap, root } = createLayerCommandHarness();
        const group = requireGroupLayer(root, "group-a");
        const command = new CreateGroupLayerCommand(tilemap.objectId, layerObjectId(root, "tile-a"), createGroupLayerData({ id: "sibling-group" }));

        expect(command.execute(editorFacade).status).toBe(Result.Status.Success);

        expect(root.findLayer("sibling-group")).toBeInstanceOf(GroupLayer);
        expect(root.findLayer("sibling-group")?.parentLayer.id).toBe("group-a");
        expect(layerIds(group)[0]).toBe("sibling-group");
    });
});
