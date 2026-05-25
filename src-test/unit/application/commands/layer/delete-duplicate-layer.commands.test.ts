import { describe, expect, it } from "vitest";

import { DeleteLayerCommand } from "@/application/commands/layer/delete-layer.command";
import { DuplicateLayerCommand } from "@/application/commands/layer/duplicate-layer.command";
import { Result } from "@/shared/types/result";

import {
    createLayerCommandHarness,
    createNoSessionFacade,
    layerObjectId,
    layerIds,
    requireGroupLayer,
} from "./layer-command-test-utils";

describe("DeleteLayerCommand", () => {
    it("removes a nested layer and restores it to the same parent and index on undo", () => {
        const { editorFacade, tilemap, root, markLayerChange, objectRegistry } = createLayerCommandHarness();
        const group = requireGroupLayer(root, "group-a");
        const originalLayer = root.findLayer("tile-a")!;
        const originalObjectId = originalLayer.objectId;
        const command = new DeleteLayerCommand(tilemap.objectId, originalLayer.objectId);

        expect(objectRegistry.has(originalObjectId)).toBe(true);
        expect(command.execute(editorFacade).status).toBe(Result.Status.Success);

        expect(root.findLayer("tile-a")).toBeNull();
        expect(objectRegistry.has(originalObjectId)).toBe(false);
        expect(originalLayer.destroyed).toBe(true);
        expect(layerIds(group)).toEqual(["group-child"]);
        expect(markLayerChange).toHaveBeenCalledTimes(1);

        expect(command.undo(editorFacade).status).toBe(Result.Status.Success);

        const restoredLayer = root.findLayer("tile-a");
        expect(restoredLayer?.parentLayer.id).toBe("group-a");
        expect(restoredLayer).not.toBe(originalLayer);
        expect(restoredLayer?.destroyed).toBe(false);
        expect(objectRegistry.has(originalObjectId)).toBe(true);
        expect(layerIds(group)).toEqual(["group-child", "tile-a"]);
        expect(markLayerChange).toHaveBeenCalledTimes(2);

        expect(command.execute(editorFacade).status).toBe(Result.Status.Success);
        expect(root.findLayer("tile-a")).toBeNull();
        expect(objectRegistry.has(originalObjectId)).toBe(false);
        expect(markLayerChange).toHaveBeenCalledTimes(3);
    });

    it("removes a group with its children and restores the complete subtree on undo", () => {
        const { editorFacade, tilemap, root, objectRegistry } = createLayerCommandHarness();
        const group = root.findLayer("group-a")!;
        const child = root.findLayer("tile-a")!;
        const command = new DeleteLayerCommand(tilemap.objectId, group.objectId);

        expect(command.execute(editorFacade).status).toBe(Result.Status.Success);

        expect(root.findLayer("group-a")).toBeNull();
        expect(root.findLayer("tile-a")).toBeNull();
        expect(objectRegistry.has(group.objectId)).toBe(false);
        expect(objectRegistry.has(child.objectId)).toBe(false);
        expect(group.destroyed).toBe(true);
        expect(child.destroyed).toBe(true);
        expect(layerIds(root)).toEqual(["group-b", "tile-root", "rule-root"]);

        expect(command.undo(editorFacade).status).toBe(Result.Status.Success);

        expect(root.findLayer("group-a")).not.toBeNull();
        expect(root.findLayer("tile-a")?.parentLayer.id).toBe("group-a");
        expect(objectRegistry.has(group.objectId)).toBe(true);
        expect(objectRegistry.has(child.objectId)).toBe(true);
        expect(layerIds(root)).toEqual(["group-a", "group-b", "tile-root", "rule-root"]);
    });

    it("returns an error and leaves the tree unchanged when the target layer is missing", () => {
        const { editorFacade, tilemap, root, markLayerChange } = createLayerCommandHarness();
        const before = root.serialize();

        expect(new DeleteLayerCommand(tilemap.objectId, `${tilemap.objectId}:layer:missing-layer`).execute(editorFacade)).toMatchObject({
            status: Result.Status.Error,
            message: { key: "Target layer not found" },
        });

        expect(root.serialize()).toEqual(before);
        expect(markLayerChange).not.toHaveBeenCalled();
    });

    it("returns an error when there is no active tilemap session", () => {
        expect(new DeleteLayerCommand("tilemap:missing", "tilemap:missing:layer:tile-a").execute(createNoSessionFacade())).toMatchObject({
            status: Result.Status.Error,
            message: { key: "Tilemap not found" },
        });
    });
});

describe("DuplicateLayerCommand", () => {
    it("duplicates a tile layer after the original, renames the copy, and removes the copy on undo", () => {
        const { editorFacade, tilemap, root, markLayerChange, objectRegistry } = createLayerCommandHarness();
        const group = requireGroupLayer(root, "group-a");
        const command = new DuplicateLayerCommand(tilemap.objectId, layerObjectId(root, "tile-a"));

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
        expect(objectRegistry.has(duplicated.objectId)).toBe(true);

        expect(command.undo(editorFacade).status).toBe(Result.Status.Success);
        expect(layerIds(group)).toEqual(["group-child", "tile-a"]);
        expect(root.findLayer(duplicated.id)).toBeNull();
        expect(objectRegistry.has(duplicated.objectId)).toBe(false);
        expect(duplicated.destroyed).toBe(true);
        expect(markLayerChange).toHaveBeenCalledTimes(2);

        expect(command.execute(editorFacade).status).toBe(Result.Status.Success);
        const restoredDuplicate = root.findLayer(duplicated.id);
        expect(restoredDuplicate?.objectId).toBe(duplicated.objectId);
        expect(restoredDuplicate?.serialize()).toEqual(duplicated.serialize());
        expect(objectRegistry.has(duplicated.objectId)).toBe(true);
        expect(markLayerChange).toHaveBeenCalledTimes(3);
    });

    it("duplicates a group without flattening or moving its existing children", () => {
        const { editorFacade, tilemap, root, objectRegistry } = createLayerCommandHarness();
        const command = new DuplicateLayerCommand(tilemap.objectId, layerObjectId(root, "group-a"));

        expect(command.execute(editorFacade).status).toBe(Result.Status.Success);

        const duplicatedGroup = root.layers[1];
        const duplicatedChildren = (duplicatedGroup as any).layers;
        expect(layerIds(root).slice(0, 2)).toEqual(["group-a", duplicatedGroup.id]);
        expect(duplicatedGroup.name).toBe("Group A (copy)");
        expect(root.findLayer("tile-a")?.parentLayer.id).toBe("group-a");
        expect(duplicatedChildren.map((layer: any) => layer.id)).not.toContain("tile-a");
        expect(duplicatedChildren.every((layer: any) => objectRegistry.has(layer.objectId))).toBe(true);
        expect(duplicatedGroup.serialize()).toMatchObject({
            type: "group",
            name: "Group A (copy)",
        });
        expect(duplicatedGroup.parentLayer.id).toBe("root");
    });

    it("returns an error and leaves the tree unchanged when the target layer is missing", () => {
        const { editorFacade, tilemap, root, markLayerChange } = createLayerCommandHarness();
        const before = root.serialize();

        expect(new DuplicateLayerCommand(tilemap.objectId, `${tilemap.objectId}:layer:missing-layer`).execute(editorFacade)).toMatchObject({
            status: Result.Status.Error,
            message: { key: "Target layer not found" },
        });

        expect(root.serialize()).toEqual(before);
        expect(markLayerChange).not.toHaveBeenCalled();
    });
});
