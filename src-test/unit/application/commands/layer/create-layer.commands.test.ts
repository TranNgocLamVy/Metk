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
    layerIds,
    requireGroupLayer,
} from "./layer-command-test-utils";

describe("CreateTileLayerCommand", () => {
    it("creates a tile layer in a group parent, opens the group, and removes it on undo", () => {
        const { editorFacade, root, markLayerChange } = createLayerCommandHarness();
        const group = requireGroupLayer(root, "group-a");
        const command = new CreateTileLayerCommand(createTileLayerData({ id: "created-tile", name: "Decoration" }), "group-a");

        const executeResult = command.execute(editorFacade);

        expect(executeResult.status).toBe(Result.Status.Success);
        expect(root.findLayer("created-tile")).toBeInstanceOf(TileLayer);
        expect(root.findLayer("created-tile")?.parentLayer.id).toBe("group-a");
        expect(layerIds(group)[0]).toBe("created-tile");
        expect(group.isOpen).toBe(true);
        expect(markLayerChange).toHaveBeenCalledTimes(1);

        const undoResult = command.undo(editorFacade);

        expect(undoResult.status).toBe(Result.Status.Success);
        expect(root.findLayer("created-tile")).toBeNull();
        expect(layerIds(group)).toEqual(["group-child", "tile-a"]);
        expect(markLayerChange).toHaveBeenCalledTimes(2);
    });

    it("creates a tile layer beside a non-group target by using that target's parent", () => {
        const { editorFacade, root } = createLayerCommandHarness();
        const group = requireGroupLayer(root, "group-a");
        const command = new CreateTileLayerCommand(createTileLayerData({ id: "sibling-tile" }), "tile-a");

        expect(command.execute(editorFacade).status).toBe(Result.Status.Success);

        expect(root.findLayer("sibling-tile")?.parentLayer.id).toBe("group-a");
        expect(layerIds(group)[0]).toBe("sibling-tile");
    });

    it("returns an error when there is no active tilemap session", () => {
        const command = new CreateTileLayerCommand(createTileLayerData(), "root");

        expect(command.execute(createNoSessionFacade())).toMatchObject({
            status: Result.Status.Error,
            message: { key: "Current session not found" },
        });
    });
});

describe("CreateRuleLayerCommand", () => {
    it("creates a rule layer at the root and removes it on undo", () => {
        const { editorFacade, root, markLayerChange } = createLayerCommandHarness();
        const command = new CreateRuleLayerCommand(createRuleLayerData({ id: "created-rule", name: "Auto Terrain" }), "root");

        expect(command.execute(editorFacade).status).toBe(Result.Status.Success);

        const createdLayer = root.findLayer("created-rule");
        expect(createdLayer).toBeInstanceOf(RuleLayer);
        expect(createdLayer?.parentLayer.id).toBe("root");
        expect(layerIds(root)[0]).toBe("created-rule");

        expect(command.undo(editorFacade).status).toBe(Result.Status.Success);
        expect(root.findLayer("created-rule")).toBeNull();
        expect(markLayerChange).toHaveBeenCalledTimes(2);
    });

    it("returns an error when undo runs without an active tilemap session", () => {
        const command = new CreateRuleLayerCommand(createRuleLayerData(), "root");

        expect(command.undo(createNoSessionFacade())).toMatchObject({
            status: Result.Status.Error,
            message: { key: "Current session not found" },
        });
    });
});

describe("CreateGroupLayerCommand", () => {
    it("creates a group layer in the target group and removes it on undo", () => {
        const { editorFacade, root } = createLayerCommandHarness();
        const group = requireGroupLayer(root, "group-a");
        const command = new CreateGroupLayerCommand(createGroupLayerData({ id: "created-group", name: "Props" }), "group-a");

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
        const { editorFacade, root } = createLayerCommandHarness();
        const group = requireGroupLayer(root, "group-a");
        const command = new CreateGroupLayerCommand(createGroupLayerData({ id: "sibling-group" }), "tile-a");

        expect(command.execute(editorFacade).status).toBe(Result.Status.Success);

        expect(root.findLayer("sibling-group")).toBeInstanceOf(GroupLayer);
        expect(root.findLayer("sibling-group")?.parentLayer.id).toBe("group-a");
        expect(layerIds(group)[0]).toBe("sibling-group");
    });
});
