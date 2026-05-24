import { describe, expect, it } from "vitest";

import { DeleteLayerCommand } from "@/application/commands/layer/delete-layer.command";
import { DuplicateLayerCommand } from "@/application/commands/layer/duplicate-layer.command";
import { Result } from "@/shared/types/result";

import {
    createLayerCommandHarness,
    createNoSessionFacade,
    layerIds,
    requireGroupLayer,
} from "./layer-command-test-utils";

describe("DeleteLayerCommand", () => {
    it("removes a nested layer and restores it to the same parent and index on undo", () => {
        const { editorFacade, root, markLayerChange } = createLayerCommandHarness();
        const group = requireGroupLayer(root, "group-a");
        const command = new DeleteLayerCommand("tile-a");

        expect(command.execute(editorFacade).status).toBe(Result.Status.Success);

        expect(root.findLayer("tile-a")).toBeNull();
        expect(layerIds(group)).toEqual(["group-child"]);
        expect(markLayerChange).toHaveBeenCalledTimes(1);

        expect(command.undo(editorFacade).status).toBe(Result.Status.Success);

        expect(root.findLayer("tile-a")?.parentLayer.id).toBe("group-a");
        expect(layerIds(group)).toEqual(["group-child", "tile-a"]);
        expect(markLayerChange).toHaveBeenCalledTimes(2);
    });

    it("removes a group with its children and restores the complete subtree on undo", () => {
        const { editorFacade, root } = createLayerCommandHarness();
        const command = new DeleteLayerCommand("group-a");

        expect(command.execute(editorFacade).status).toBe(Result.Status.Success);

        expect(root.findLayer("group-a")).toBeNull();
        expect(root.findLayer("tile-a")).toBeNull();
        expect(layerIds(root)).toEqual(["group-b", "tile-root", "rule-root"]);

        expect(command.undo(editorFacade).status).toBe(Result.Status.Success);

        expect(root.findLayer("group-a")).not.toBeNull();
        expect(root.findLayer("tile-a")?.parentLayer.id).toBe("group-a");
        expect(layerIds(root)).toEqual(["group-a", "group-b", "tile-root", "rule-root"]);
    });

    it("returns an error and leaves the tree unchanged when the target layer is missing", () => {
        const { editorFacade, root, markLayerChange } = createLayerCommandHarness();
        const before = root.serialize();

        expect(new DeleteLayerCommand("missing-layer").execute(editorFacade)).toMatchObject({
            status: Result.Status.Error,
            message: { key: "Target layer not found" },
        });

        expect(root.serialize()).toEqual(before);
        expect(markLayerChange).not.toHaveBeenCalled();
    });

    it("returns an error when there is no active tilemap session", () => {
        expect(new DeleteLayerCommand("tile-a").execute(createNoSessionFacade())).toMatchObject({
            status: Result.Status.Error,
            message: { key: "Current session not found" },
        });
    });
});

describe("DuplicateLayerCommand", () => {
    it("duplicates a tile layer after the original, renames the copy, and removes the copy on undo", () => {
        const { editorFacade, root, markLayerChange } = createLayerCommandHarness();
        const group = requireGroupLayer(root, "group-a");
        const command = new DuplicateLayerCommand("tile-a");

        expect(command.execute(editorFacade).status).toBe(Result.Status.Success);

        const duplicated = group.layers[2];
        expect(layerIds(group)).toEqual(["group-child", "tile-a", duplicated.id]);
        expect(duplicated.id).not.toBe("tile-a");
        expect(duplicated.name).toBe("Ground (copy)");
        expect(duplicated.serialize()).toMatchObject({
            type: "tile",
            layerData: "1:0,0\n0,0",
        });
        expect(duplicated.parentLayer.id).toBe("group-a");

        expect(command.undo(editorFacade).status).toBe(Result.Status.Success);
        expect(layerIds(group)).toEqual(["group-child", "tile-a"]);
        expect(root.findLayer(duplicated.id)).toBeNull();
        expect(markLayerChange).toHaveBeenCalledTimes(2);
    });

    it("duplicates a group without flattening or moving its existing children", () => {
        const { editorFacade, root } = createLayerCommandHarness();
        const command = new DuplicateLayerCommand("group-a");

        expect(command.execute(editorFacade).status).toBe(Result.Status.Success);

        const duplicatedGroup = root.layers[1];
        expect(layerIds(root).slice(0, 2)).toEqual(["group-a", duplicatedGroup.id]);
        expect(duplicatedGroup.name).toBe("Group A (copy)");
        expect(root.findLayer("tile-a")?.parentLayer.id).toBe("group-a");
        expect(duplicatedGroup.serialize()).toMatchObject({
            type: "group",
            name: "Group A (copy)",
        });
        expect(duplicatedGroup.parentLayer.id).toBe("root");
    });

    it("returns an error and leaves the tree unchanged when the target layer is missing", () => {
        const { editorFacade, root, markLayerChange } = createLayerCommandHarness();
        const before = root.serialize();

        expect(new DuplicateLayerCommand("missing-layer").execute(editorFacade)).toMatchObject({
            status: Result.Status.Error,
            message: { key: "Target layer not found" },
        });

        expect(root.serialize()).toEqual(before);
        expect(markLayerChange).not.toHaveBeenCalled();
    });
});
