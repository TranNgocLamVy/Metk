import { describe, expect, it } from "vitest";

import { RenameLayerCommand } from "@/application/commands/layer/rename-layer.command";
import { ToggleLayerLockCommand } from "@/application/commands/layer/toggle-layer-lock.command";
import { ToggleLayerVisibilityCommand } from "@/application/commands/layer/toggle-layer-visibility.command";
import { ToggleOpenGroupLayerCommand } from "@/application/commands/layer/toggle-open-group-layer.command";
import { Result } from "@/shared/types/result";

import {
    createLayerCommandHarness,
    createNoSessionFacade,
    layerObjectId,
    requireGroupLayer,
} from "./layer-command-test-utils";

describe("RenameLayerCommand", () => {
    it("renames a layer and restores its previous name on undo", () => {
        const { editorFacade, tilemap, root, markLayerChange } = createLayerCommandHarness();
        const command = new RenameLayerCommand(tilemap.objectId, layerObjectId(root, "tile-root"), "Collision");

        expect(command.execute(editorFacade).status).toBe(Result.Status.Success);
        expect(root.findLayer("tile-root")?.name).toBe("Collision");
        expect(markLayerChange).toHaveBeenCalledTimes(1);

        expect(command.undo(editorFacade).status).toBe(Result.Status.Success);
        expect(root.findLayer("tile-root")?.name).toBe("Root Tile");
        expect(markLayerChange).toHaveBeenCalledTimes(2);
    });

    it("returns an error and leaves names unchanged when the target layer is missing", () => {
        const { editorFacade, tilemap, root, markLayerChange } = createLayerCommandHarness();
        const before = root.serialize();

        expect(new RenameLayerCommand(tilemap.objectId, `${tilemap.objectId}:layer:missing-layer`, "Collision").execute(editorFacade)).toMatchObject({
            status: Result.Status.Error,
            message: { key: "Target layer not found" },
        });

        expect(root.serialize()).toEqual(before);
        expect(markLayerChange).not.toHaveBeenCalled();
    });
});

describe("ToggleLayerLockCommand", () => {
    it("updates lock state, emits selected-layer changes, and restores lock state on undo", () => {
        const { editorFacade, tilemap, root, markLayerChange, emit, session } = createLayerCommandHarness();
        const command = new ToggleLayerLockCommand(tilemap.objectId, layerObjectId(root, "tile-root"), true);

        expect(root.findLayer("tile-root")?.locked).toBe(false);
        expect(command.execute(editorFacade).status).toBe(Result.Status.Success);

        expect(root.findLayer("tile-root")?.locked).toBe(true);
        expect(markLayerChange).toHaveBeenCalledTimes(1);
        expect(emit).toHaveBeenCalledWith("onSelectedLayersChanged", session.layerState.selectedLayers);

        expect(command.undo(editorFacade).status).toBe(Result.Status.Success);

        expect(root.findLayer("tile-root")?.locked).toBe(false);
        expect(markLayerChange).toHaveBeenCalledTimes(2);
        expect(emit).toHaveBeenCalledTimes(2);
    });

    it("returns an error without emitting when the target layer is missing", () => {
        const { editorFacade, tilemap, root, emit, markLayerChange } = createLayerCommandHarness();
        const before = root.serialize();

        expect(new ToggleLayerLockCommand(tilemap.objectId, `${tilemap.objectId}:layer:missing-layer`, true).execute(editorFacade)).toMatchObject({
            status: Result.Status.Error,
            message: { key: "Target layer not found" },
        });

        expect(root.serialize()).toEqual(before);
        expect(markLayerChange).not.toHaveBeenCalled();
        expect(emit).not.toHaveBeenCalled();
    });
});

describe("ToggleLayerVisibilityCommand", () => {
    it("updates visibility, emits selected-layer changes, and restores visibility on undo", () => {
        const { editorFacade, tilemap, root, markLayerChange, emit, session } = createLayerCommandHarness();
        const command = new ToggleLayerVisibilityCommand(tilemap.objectId, layerObjectId(root, "tile-root"), false);

        expect(root.findLayer("tile-root")?.visible).toBe(true);
        expect(command.execute(editorFacade).status).toBe(Result.Status.Success);

        expect(root.findLayer("tile-root")?.visible).toBe(false);
        expect(markLayerChange).toHaveBeenCalledTimes(1);
        expect(emit).toHaveBeenCalledWith("onSelectedLayersChanged", session.layerState.selectedLayers);

        expect(command.undo(editorFacade).status).toBe(Result.Status.Success);

        expect(root.findLayer("tile-root")?.visible).toBe(true);
        expect(markLayerChange).toHaveBeenCalledTimes(2);
        expect(emit).toHaveBeenCalledTimes(2);
    });

    it("returns an error when there is no active tilemap session", () => {
        expect(new ToggleLayerVisibilityCommand("tilemap:missing", "tilemap:missing:layer:tile-root", false).execute(createNoSessionFacade())).toMatchObject({
            status: Result.Status.Error,
            message: { key: "Tilemap not found" },
        });
    });
});

describe("ToggleOpenGroupLayerCommand", () => {
    it("toggles a group layer open state and marks the layer tree changed", () => {
        const { editorFacade, tilemap, root, markLayerChange } = createLayerCommandHarness();
        const group = requireGroupLayer(root, "group-a");
        const command = new ToggleOpenGroupLayerCommand(tilemap.objectId, group.objectId);

        expect(group.isOpen).toBe(false);
        expect(command.execute(editorFacade).status).toBe(Result.Status.Success);

        expect(group.isOpen).toBe(true);
        expect(markLayerChange).toHaveBeenCalledTimes(1);
    });

    it("honors a forced open state and reports that undo is unsupported", () => {
        const { editorFacade, tilemap, root } = createLayerCommandHarness();
        const group = requireGroupLayer(root, "group-a");
        const command = new ToggleOpenGroupLayerCommand(tilemap.objectId, group.objectId, false);

        group.toggleOpen(true);

        expect(command.execute(editorFacade).status).toBe(Result.Status.Success);
        expect(group.isOpen).toBe(false);
        expect(command.undo(editorFacade)).toMatchObject({
            status: Result.Status.Error,
            message: { key: "ToggleOpenGroupLayerCommand cannot be undone" },
        });
    });

    it("returns an error without mutating when the target is not a group layer", () => {
        const { editorFacade, tilemap, root, markLayerChange } = createLayerCommandHarness();
        const before = root.serialize();

        expect(new ToggleOpenGroupLayerCommand(tilemap.objectId, layerObjectId(root, "tile-root")).execute(editorFacade)).toMatchObject({
            status: Result.Status.Error,
            message: { key: "Target layer is not a group layer" },
        });

        expect(root.serialize()).toEqual(before);
        expect(markLayerChange).not.toHaveBeenCalled();
    });
});
