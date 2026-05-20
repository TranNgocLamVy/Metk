import { describe, expect, it } from "vitest";

import { MoveLayerCommand } from "@/application/commands/layer/move-layer.command";
import { Result } from "@/shared/types/result";

import {
    createLayerCommandHarness,
    createNoSessionFacade,
    layerIds,
    requireGroupLayer,
} from "./layer-command-test-utils";

describe("MoveLayerCommand", () => {
    it("moves a layer within the same parent and restores the original order on undo", () => {
        const { editorFacade, root, markLayerChange } = createLayerCommandHarness();
        const command = new MoveLayerCommand("root", "rule-root", 1);

        expect(command.execute(editorFacade).status).toBe(Result.Status.Success);

        expect(layerIds(root)).toEqual(["group-a", "rule-root", "group-b", "tile-root"]);
        expect(root.findLayer("rule-root")?.parentLayer.id).toBe("root");
        expect(markLayerChange).toHaveBeenCalledTimes(1);

        expect(command.undo(editorFacade).status).toBe(Result.Status.Success);

        expect(layerIds(root)).toEqual(["group-a", "group-b", "tile-root", "rule-root"]);
        expect(markLayerChange).toHaveBeenCalledTimes(2);
    });

    it("moves a layer between parents, opens the destination group, and restores it on undo", () => {
        const { editorFacade, root } = createLayerCommandHarness();
        const group = requireGroupLayer(root, "group-a");
        const command = new MoveLayerCommand("group-a", "tile-root", 1);

        expect(group.isOpen).toBe(false);
        expect(command.execute(editorFacade).status).toBe(Result.Status.Success);

        expect(group.isOpen).toBe(true);
        expect(layerIds(group)).toEqual(["group-child", "tile-root", "tile-a"]);
        expect(layerIds(root)).toEqual(["group-a", "group-b", "rule-root"]);
        expect(root.findLayer("tile-root")?.parentLayer.id).toBe("group-a");

        expect(command.undo(editorFacade).status).toBe(Result.Status.Success);

        expect(layerIds(group)).toEqual(["group-child", "tile-a"]);
        expect(layerIds(root)).toEqual(["group-a", "group-b", "tile-root", "rule-root"]);
        expect(root.findLayer("tile-root")?.parentLayer.id).toBe("root");
    });

    it("uses a non-group parent target as a request to move beside that target", () => {
        const { editorFacade, root } = createLayerCommandHarness();
        const group = requireGroupLayer(root, "group-a");
        const command = new MoveLayerCommand("tile-a", "group-child", 1);

        expect(command.execute(editorFacade).status).toBe(Result.Status.Success);

        expect(layerIds(group)).toEqual(["tile-a", "group-child"]);
        expect(root.findLayer("group-child")?.parentLayer.id).toBe("group-a");
    });

    it("returns an error without mutating when either requested layer is missing", () => {
        const { editorFacade, root, markLayerChange } = createLayerCommandHarness();
        const before = root.serialize();

        expect(new MoveLayerCommand("group-a", "missing-layer", 0).execute(editorFacade)).toMatchObject({
            status: Result.Status.Error,
            message: { key: "Target layer not found" },
        });
        expect(new MoveLayerCommand("missing-parent", "tile-root", 0).execute(editorFacade)).toMatchObject({
            status: Result.Status.Error,
            message: { key: "Target layer not found" },
        });

        expect(root.serialize()).toEqual(before);
        expect(markLayerChange).not.toHaveBeenCalled();
    });

    it("rejects negative destination indexes before removing the layer", () => {
        const { editorFacade, root, markLayerChange } = createLayerCommandHarness();
        const before = root.serialize();

        expect(new MoveLayerCommand("group-a", "tile-root", -1).execute(editorFacade)).toMatchObject({
            status: Result.Status.Error,
            message: { key: "Invalid layer's index: -1" },
        });

        expect(root.serialize()).toEqual(before);
        expect(root.findLayer("tile-root")?.parentLayer.id).toBe("root");
        expect(markLayerChange).not.toHaveBeenCalled();
    });

    it("rejects moving a group into itself or one of its descendants", () => {
        const { editorFacade, root, markLayerChange } = createLayerCommandHarness();
        const before = root.serialize();

        expect(new MoveLayerCommand("group-a", "group-a", 0).execute(editorFacade)).toMatchObject({
            status: Result.Status.Error,
            message: { key: "Cannot move a layer into itself or its descendant" },
        });
        expect(new MoveLayerCommand("group-child", "group-a", 0).execute(editorFacade)).toMatchObject({
            status: Result.Status.Error,
            message: { key: "Cannot move a layer into itself or its descendant" },
        });

        expect(root.serialize()).toEqual(before);
        expect(root.findLayer("group-child")?.parentLayer.id).toBe("group-a");
        expect(markLayerChange).not.toHaveBeenCalled();
    });

    it("rejects moving the root layer", () => {
        const { editorFacade, root, markLayerChange } = createLayerCommandHarness();
        const before = root.serialize();

        expect(new MoveLayerCommand("group-a", "root", 0).execute(editorFacade)).toMatchObject({
            status: Result.Status.Error,
            message: { key: "Cannot move root layer" },
        });

        expect(root.serialize()).toEqual(before);
        expect(markLayerChange).not.toHaveBeenCalled();
    });

    it("returns an error when there is no active tilemap session", () => {
        expect(new MoveLayerCommand("root", "tile-root", 0).execute(createNoSessionFacade())).toMatchObject({
            status: Result.Status.Error,
            message: { key: "Current session not found" },
        });
    });
});
