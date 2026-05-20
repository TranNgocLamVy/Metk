import { beforeEach, describe, expect, it, vi } from "vitest";

const storageState = vi.hoisted(() => ({
    TilesetStorageService: {
        load: vi.fn(),
        save: vi.fn(),
        remove: vi.fn(),
    },
}));

vi.mock("@/infrastructure/container", () => storageState);
vi.mock("@/shared/services/console.service", () => ({
    Console: {
        log: vi.fn(),
        success: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

import { TilesetManager } from "@/application/resources/tileset/tileset.manager";
import { TilesetStorageService } from "@/infrastructure/container";
import { Result } from "@/shared/types/result";

import {
    createDeferred,
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
        const manager = new TilesetManager(createProjectPathSystem());
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

    it("loads a tileset from storage and then serves cache hits without reading storage again", async () => {
        const manager = new TilesetManager(createProjectPathSystem());
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
        const manager = new TilesetManager(createProjectPathSystem());
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
        const manager = new TilesetManager(createProjectPathSystem());

        const result = await manager.loadTileset("missing-tileset");

        expect(result).toMatchObject({
            status: Result.Status.Error,
            message: { key: "message.tileset.metadataNotFound" },
        });
        expect(TilesetStorageService.load).not.toHaveBeenCalled();
    });

    it("returns the storage error when storage loading fails", async () => {
        const manager = new TilesetManager(createProjectPathSystem());
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
        const manager = new TilesetManager(createProjectPathSystem());
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
        const manager = new TilesetManager(createProjectPathSystem());
        const addResult = await manager.addTileset(createTilesetData("tileset-a"), "C:/Project/Metk/test-project/tilesets/tileset-a.json");
        const unload = vi.spyOn(addResult.data!, "unload");

        const result = await manager.removeTileset("tileset-a");

        expect(result.status).toBe(Result.Status.Success);
        expect(unload).toHaveBeenCalledTimes(1);
        expect(manager.getTilesetById("tileset-a")).toBeNull();
        expect(manager.getTilesetMetadataById("tileset-a")).toBeNull();
        expect(TilesetStorageService.remove).not.toHaveBeenCalled();
    });

    it("deletes metadata and storage for an unloaded tileset", async () => {
        const manager = new TilesetManager(createProjectPathSystem());
        manager.addTilesetMetadata(createTilesetMetadata("tileset-a"));

        const result = await manager.deleteTileset("tileset-a");

        expect(result.status).toBe(Result.Status.Success);
        expect(TilesetStorageService.remove).toHaveBeenCalledWith("C:/Project/Metk/test-project/tilesets/tileset-a.json");
        expect(manager.serialize()).toEqual([]);
    });

    it("keeps metadata when storage deletion fails", async () => {
        const manager = new TilesetManager(createProjectPathSystem());
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
        const manager = new TilesetManager(createProjectPathSystem());
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
});
