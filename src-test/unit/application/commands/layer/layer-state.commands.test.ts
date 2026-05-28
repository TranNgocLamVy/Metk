import { describe, expect, it, vi } from "vitest";

import { UpdatePropertyCommand } from "@/application/commands/update-property.command";
import { Result } from "@/shared/types/result";

import {
    createLayerCommandHarness,
    layerObjectId,
    requireGroupLayer,
} from "./layer-command-test-utils";

describe("UpdatePropertyCommand layer state updates", () => {
    it("registers layer state properties under their decorated keys", () => {
        const { root } = createLayerCommandHarness();
        const layer = root.findLayer("tile-root")!;
        const group = requireGroupLayer(root, "group-a");

        expect(layer.properties.has("name")).toBe(true);
        expect(layer.properties.has("_visible")).toBe(true);
        expect(layer.properties.has("_locked")).toBe(true);
        expect(group.properties.has("isOpen")).toBe(true);
    });

    it("renames a layer and emits commit, undo, and redo metadata", () => {
        const { editorFacade, root, markLayerChange, emit } = createLayerCommandHarness();
        const layer = root.findLayer("tile-root")!;
        const listener = vi.fn();
        layer.eventEmitter.on("updateProperty", listener);

        const command = new UpdatePropertyCommand(layer.objectId, "name", layer.name, "Collision");

        expect(command.execute(editorFacade)).toEqual(Result.Success());
        expect(layer.name).toBe("Collision");
        expect(listener).toHaveBeenLastCalledWith("name", "Collision", {
            origin: "commit",
            source: "UpdatePropertyCommand",
        });

        expect(command.undo(editorFacade)).toEqual(Result.Success());
        expect(layer.name).toBe("Root Tile");
        expect(listener).toHaveBeenLastCalledWith("name", "Root Tile", {
            origin: "undo",
            source: "UpdatePropertyCommand",
        });

        expect(command.redo(editorFacade)).toEqual(Result.Success());
        expect(layer.name).toBe("Collision");
        expect(listener).toHaveBeenLastCalledWith("name", "Collision", {
            origin: "redo",
            source: "UpdatePropertyCommand",
        });

        expect(markLayerChange).not.toHaveBeenCalled();
        expect(emit).not.toHaveBeenCalled();
    });

    it("updates raw visibility without session side effects", () => {
        const { editorFacade, root, markLayerChange, emit } = createLayerCommandHarness();
        const layer = root.findLayer("tile-root")!;
        const property = layer.properties.get("_visible")!;
        const command = new UpdatePropertyCommand(layer.objectId, "_visible", property.getter(), false);

        expect(command.execute(editorFacade)).toEqual(Result.Success());

        expect(property.getter()).toBe(false);
        expect(layer.visible).toBe(false);
        expect(markLayerChange).not.toHaveBeenCalled();
        expect(emit).not.toHaveBeenCalled();

        expect(command.undo(editorFacade)).toEqual(Result.Success());

        expect(property.getter()).toBe(true);
        expect(layer.visible).toBe(true);
        expect(markLayerChange).not.toHaveBeenCalled();
        expect(emit).not.toHaveBeenCalled();
    });

    it("updates raw lock state without session side effects", () => {
        const { editorFacade, root, markLayerChange, emit } = createLayerCommandHarness();
        const layer = root.findLayer("tile-root")!;
        const property = layer.properties.get("_locked")!;
        const command = new UpdatePropertyCommand(layer.objectId, "_locked", property.getter(), true);

        expect(command.execute(editorFacade)).toEqual(Result.Success());

        expect(property.getter()).toBe(true);
        expect(layer.locked).toBe(true);
        expect(markLayerChange).not.toHaveBeenCalled();
        expect(emit).not.toHaveBeenCalled();
    });

    it("toggles a registered group open property", () => {
        const { editorFacade, root, markLayerChange } = createLayerCommandHarness();
        const group = requireGroupLayer(root, "group-a");
        const property = group.properties.get("isOpen")!;
        const command = new UpdatePropertyCommand(group.objectId, "isOpen", property.getter(), true);

        expect(group.isOpen).toBe(false);
        expect(command.execute(editorFacade)).toEqual(Result.Success());

        expect(group.isOpen).toBe(true);
        expect(markLayerChange).not.toHaveBeenCalled();
    });

    it("returns an error without mutating when the property is missing", () => {
        const { editorFacade, root, markLayerChange } = createLayerCommandHarness();
        const before = root.serialize();

        expect(new UpdatePropertyCommand(layerObjectId(root, "tile-root"), "missing", null, true).execute(editorFacade)).toMatchObject({
            status: Result.Status.Error,
            message: { key: "Property not found: missing" },
        });

        expect(root.serialize()).toEqual(before);
        expect(markLayerChange).not.toHaveBeenCalled();
    });
});
