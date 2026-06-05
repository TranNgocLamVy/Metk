import { beforeEach, describe, expect, it, vi } from "vitest";

const storageState = vi.hoisted(() => ({
    TilesetStorageService: {
        load: vi.fn(),
        save: vi.fn(),
        remove: vi.fn(),
    },
}));

vi.mock("@/infrastructure/container", () => storageState);
vi.mock("@/application/actions/tileset.actions", () => ({
    importTileset: vi.fn(),
    removeTilesetFromProject: vi.fn(),
}));
vi.mock("@/ui/notifications/console-gateway", () => ({
    Console: {
        log: vi.fn(),
        success: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

import { TilesetManager } from "@/application/resources/tileset/tileset.manager";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { TilesetStorageService } from "@/infrastructure/container";
import { Result } from "@/shared/types/result";

import {
    createDeferred,
    createObjectRegistry,
    createProjectPathSystem,
    createTilesetData,
    createTilesetMetadata,
} from "../resource-manager-test-utils";

describe("TilesetManager", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (TilesetStorageService.load as any).mockResolvedValue(Result.Success(createTilesetData()));
        (TilesetStorageService.save as any).mockResolvedValue(Result.Success());
        (TilesetStorageService.remove as any).mockResolvedValue(Result.Success());
    });

    it("adds a tileset, stores metadata, caches the loaded model, and emits loaded metadata on serialize", async () => {
        const manager = new TilesetManager(createProjectPathSystem(), createObjectRegistry());
        const tilesetData = createTilesetData("tileset-a", { name: "Grass" });

        const result = await manager.addTileset(tilesetData, "C:/Project/Metk/test-project/assets/grass.tileset.json");

        expect(result.status).toBe(Result.Status.Success);
        expect(manager.getTilesetById("tileset-a")).toBe(result.data!);
        expect(manager.getTilesetMetadataById("tileset-a")).toEqual({
            id: "tileset-a",
            name: "Grass",
            tilesetRelPath: "assets/grass.tileset.json",
        });

        result.data!.rename("Renamed Grass");
        expect(manager.serialize()).toEqual([{
            id: "tileset-a",
            name: "Renamed Grass",
            tilesetRelPath: "assets/grass.tileset.json",
        }]);
    });

    it("registers loaded tilesets with generated tiles, then unregisters them on unload", async () => {
        const objectRegistry = new EditorObjectRegistry();
        const manager = new TilesetManager(createProjectPathSystem(), objectRegistry);

        const result = await manager.addTileset(createTilesetData("tileset-a"), "C:/Project/Metk/test-project/assets/grass.tileset.json");
        const tileset = result.data!;
        const tile = tileset.getTileFromId(0)!;

        expect(objectRegistry.has(tileset.objectId)).toBe(true);
        expect(tile.objectId).toBe("tileset:tileset-a:tile:0");
        expect(objectRegistry.has(tile.objectId)).toBe(true);

        await manager.unloadTileset("tileset-a");

        expect(objectRegistry.has(tileset.objectId)).toBe(false);
        expect(objectRegistry.has(tile.objectId)).toBe(false);
        expect(tileset.destroyed).toBe(true);
        expect(tile.destroyed).toBe(true);
    });

    it("loads a tileset from storage and then serves cache hits without reading storage again", async () => {
        const manager = new TilesetManager(createProjectPathSystem(), createObjectRegistry());
        manager.addTilesetMetadata(createTilesetMetadata("tileset-a"));
        (TilesetStorageService.load as any).mockResolvedValue(Result.Success(createTilesetData("tileset-a")));

        const first = await manager.loadTileset("tileset-a");
        const second = await manager.loadTileset("tileset-a");

        expect(first.status).toBe(Result.Status.Success);
        expect(second.status).toBe(Result.Status.Success);
        expect(second.data).toBe(first.data);
        expect(TilesetStorageService.load).toHaveBeenCalledTimes(1);
        expect(TilesetStorageService.load).toHaveBeenCalledWith("C:/Project/Metk/test-project/tilesets/tileset-a.json");
    });

    it("deduplicates concurrent pending loads for the same tileset", async () => {
        const manager = new TilesetManager(createProjectPathSystem(), createObjectRegistry());
        const deferred = createDeferred<ReturnType<typeof Result.Success>>();
        manager.addTilesetMetadata(createTilesetMetadata("tileset-a"));
        (TilesetStorageService.load as any).mockReturnValue(deferred.promise);

        const firstPromise = manager.loadTileset("tileset-a");
        const secondPromise = manager.loadTileset("tileset-a");
        deferred.resolve(Result.Success(createTilesetData("tileset-a")) as any);
        const [first, second] = await Promise.all([firstPromise, secondPromise]);

        expect(first.status).toBe(Result.Status.Success);
        expect(second.status).toBe(Result.Status.Success);
        expect(second.data).toBe(first.data);
        expect(TilesetStorageService.load).toHaveBeenCalledTimes(1);
    });

    it("returns metadata-not-found when loading an unknown tileset", async () => {
        const manager = new TilesetManager(createProjectPathSystem(), createObjectRegistry());

        const result = await manager.loadTileset("missing-tileset");

        expect(result).toMatchObject({
            status: Result.Status.Error,
            message: { key: "message.tileset.metadataNotFound" },
        });
        expect(TilesetStorageService.load).not.toHaveBeenCalled();
    });

    it("returns the storage error when storage loading fails", async () => {
        const manager = new TilesetManager(createProjectPathSystem(), createObjectRegistry());
        manager.addTilesetMetadata(createTilesetMetadata("tileset-a"));
        (TilesetStorageService.load as any).mockResolvedValue(Result.Error("storage failed"));

        const result = await manager.loadTileset("tileset-a");

        expect(result).toMatchObject({
            status: Result.Status.Error,
            message: { key: "storage failed" },
        });
        expect(manager.getTilesetById("tileset-a")).toBeNull();
    });

    it("saves a loaded tileset and errors when the tileset is not loaded", async () => {
        const manager = new TilesetManager(createProjectPathSystem(), createObjectRegistry());
        const loadResult = await manager.addTileset(createTilesetData("tileset-a"), "C:/Project/Metk/test-project/tilesets/tileset-a.json");
        loadResult.data!.rename("Saved Tileset");

        expect((await manager.saveTileset("tileset-a")).status).toBe(Result.Status.Success);
        expect(TilesetStorageService.save).toHaveBeenCalledWith(
            "C:/Project/Metk/test-project/tilesets/tileset-a.json",
            expect.objectContaining({ id: "tileset-a", name: "Saved Tileset" }),
        );

        expect(await manager.saveTileset("missing-tileset")).toMatchObject({
            status: Result.Status.Error,
            message: { key: "message.tileset.notFound", options: { id: "missing-tileset" } },
        });
    });

    it("removes loaded metadata without deleting storage and unloads the cached tileset", async () => {
        const manager = new TilesetManager(createProjectPathSystem(), createObjectRegistry());
        const addResult = await manager.addTileset(createTilesetData("tileset-a"), "C:/Project/Metk/test-project/tilesets/tileset-a.json");
        const destroy = vi.spyOn(addResult.data!, "destroy");

        const result = await manager.removeTileset("tileset-a");

        expect(result.status).toBe(Result.Status.Success);
        expect(destroy).toHaveBeenCalledTimes(1);
        expect(manager.getTilesetById("tileset-a")).toBeNull();
        expect(manager.getTilesetMetadataById("tileset-a")).toBeNull();
        expect(TilesetStorageService.remove).not.toHaveBeenCalled();
    });

    it("deletes metadata and storage for an unloaded tileset", async () => {
        const manager = new TilesetManager(createProjectPathSystem(), createObjectRegistry());
        manager.addTilesetMetadata(createTilesetMetadata("tileset-a"));

        const result = await manager.deleteTileset("tileset-a");

        expect(result.status).toBe(Result.Status.Success);
        expect(TilesetStorageService.remove).toHaveBeenCalledWith("C:/Project/Metk/test-project/tilesets/tileset-a.json");
        expect(manager.serialize()).toEqual([]);
    });

    it("keeps metadata when storage deletion fails", async () => {
        const manager = new TilesetManager(createProjectPathSystem(), createObjectRegistry());
        manager.addTilesetMetadata(createTilesetMetadata("tileset-a"));
        (TilesetStorageService.remove as any).mockResolvedValue(Result.Error("delete failed"));

        const result = await manager.deleteTileset("tileset-a");

        expect(result).toMatchObject({
            status: Result.Status.Error,
            message: { key: "message.tileset.deleteFail" },
        });
        expect(manager.getTilesetMetadataById("tileset-a")).not.toBeNull();
    });

    it("serializes unloaded metadata without requiring storage reads", () => {
        const manager = new TilesetManager(createProjectPathSystem(), createObjectRegistry());
        manager.loadTilesetsMetadata([
            createTilesetMetadata("tileset-a"),
            createTilesetMetadata("tileset-b", { name: "Tileset B" }),
        ]);

        expect(manager.serialize()).toEqual([
            createTilesetMetadata("tileset-a"),
            createTilesetMetadata("tileset-b", { name: "Tileset B" }),
        ]);
        expect(TilesetStorageService.load).not.toHaveBeenCalled();
    });

    it("deep-clones a loaded tileset as an unregistered temporary copy preserving root and child ids", async () => {
        const objectRegistry = new EditorObjectRegistry();
        const manager = new TilesetManager(createProjectPathSystem(), objectRegistry);
        const addResult = await manager.addTileset(createTilesetData("tileset-a", {
            tiles: [{
                id: 3,
                collisionObjects: [{
                    id: "collision-a",
                    kind: "box",
                    name: "Collision A",
                    x: 1,
                    y: 2,
                    width: 3,
                    height: 4,
                }],
            }],
        }), "C:/Project/Metk/test-project/tilesets/tileset-a.json");
        const loadedTileset = addResult.data!;

        const clone = manager.deepCloneTileset("tileset-a");

        expect(clone).not.toBeNull();
        expect(clone).not.toBe(loadedTileset);
        expect(clone?.id).toBe("tileset-a");
        expect(clone?.objectId).toBe("tileset:tileset-a");
        expect(clone?.getTileFromId(3)?.objectId).toBe("tileset:tileset-a:tile:3");
        expect(clone?.serialize()).toEqual(loadedTileset.serialize());
        expect(objectRegistry.get(clone!.objectId)).toBe(loadedTileset);
        expect(manager.deepCloneTileset("missing-tileset")).toBeNull();
    });

    it("clones a loaded tileset with new ids, cloneFrom metadata, and registry-safe objectIds", async () => {
        const objectRegistry = new EditorObjectRegistry();
        const manager = new TilesetManager(createProjectPathSystem(), objectRegistry);
        await manager.addTileset(createTilesetData("tileset-a", {
            tiles: [{
                id: 3,
                collisionObjects: [{
                    id: "collision-a",
                    kind: "box",
                    name: "Collision A",
                    x: 1,
                    y: 2,
                    width: 3,
                    height: 4,
                }],
            }],
        }), "C:/Project/Metk/test-project/tilesets/tileset-a.json");

        const clone = manager.cloneTileset("tileset-a");
        const clonedData = clone!.serialize();

        expect(clone).not.toBeNull();
        expect(clonedData.id).not.toBe("tileset-a");
        expect(clonedData.cloneFrom).toBe("tileset-a");
        expect(clonedData.tiles[0].id).not.toBe(3);
        expect(clonedData.tiles[0].cloneFrom).toBe("3");
        expect(clonedData.tiles[0].collisionObjects?.[0].id).not.toBe("collision-a");
        expect(clonedData.tiles[0].collisionObjects?.[0].cloneFrom).toBe("collision-a");
        expect(clone!.objectId).toBe(`tileset:${clonedData.id}`);
        expect(clone!.getTileFromId(clonedData.tiles[0].id)?.objectId).toBe(`tileset:${clonedData.id}:tile:${clonedData.tiles[0].id}`);
        expect(() => objectRegistry.registerTree(clone!)).not.toThrow();
    });
});
