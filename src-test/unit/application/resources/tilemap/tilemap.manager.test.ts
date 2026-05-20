import { beforeEach, describe, expect, it, vi } from "vitest";

const storageState = vi.hoisted(() => ({
    TilemapStorageService: {
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

import { TilemapManager } from "@/application/resources/tilemap/tilemap.manager";
import { TilemapStorageService } from "@/infrastructure/container";
import { Result } from "@/shared/types/result";

import {
    createDeferred,
    createProjectPathSystem,
    createTilemapData,
    createTilemapMetadata,
} from "../resource-manager-test-utils";

const createDependencyManagers = () => ({
    tilesetManager: {
        loadTilesets: vi.fn(async () => []),
    },
    rulesetManager: {
        loadRulesets: vi.fn(async () => []),
    },
});

describe("TilemapManager", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (TilemapStorageService.load as any).mockResolvedValue(Result.Success(createTilemapData()));
        (TilemapStorageService.save as any).mockResolvedValue(Result.Success());
        (TilemapStorageService.remove as any).mockResolvedValue(Result.Success());
    });

    it("adds a tilemap, stores metadata, caches the loaded model, and loads dependencies", async () => {
        const deps = createDependencyManagers();
        const manager = new TilemapManager(deps.tilesetManager as any, deps.rulesetManager as any, createProjectPathSystem());
        const tilemapData = createTilemapData("tilemap-a", {
            name: "Overworld",
            tilesets: { refs: [{ id: "tileset-a", index: 0, name: "Tileset A" }], nextIndex: 1 },
            rulesets: { refs: [{ id: "ruleset-a", index: 0, name: "Ruleset A" }], nextIndex: 1 },
        });

        const result = await manager.addTilemap(tilemapData, "C:/Project/Metk/test-project/maps/overworld.json");

        expect(result.status).toBe(Result.Status.Success);
        expect(deps.tilesetManager.loadTilesets).toHaveBeenCalledWith(["tileset-a"]);
        expect(deps.rulesetManager.loadRulesets).toHaveBeenCalledWith(["ruleset-a"]);
        expect(manager.serialize()).toEqual([{
            id: "tilemap-a",
            name: "Overworld",
            tilemapRelPath: "maps/overworld.json",
        }]);
    });

    it("loads a tilemap from storage and then serves cache hits without reading storage again", async () => {
        const deps = createDependencyManagers();
        const manager = new TilemapManager(deps.tilesetManager as any, deps.rulesetManager as any, createProjectPathSystem());
        manager.addTilemapMetadata(createTilemapMetadata("tilemap-a"));
        (TilemapStorageService.load as any).mockResolvedValue(Result.Success(createTilemapData("tilemap-a")));

        const first = await manager.loadTilemap("tilemap-a");
        const second = await manager.loadTilemap("tilemap-a");

        expect(first.status).toBe(Result.Status.Success);
        expect(second.status).toBe(Result.Status.Success);
        expect(second.data).toBe(first.data);
        expect(TilemapStorageService.load).toHaveBeenCalledTimes(1);
        expect(TilemapStorageService.load).toHaveBeenCalledWith("C:/Project/Metk/test-project/tilemaps/tilemap-a.json");
    });

    it("deduplicates concurrent pending loads for the same tilemap", async () => {
        const deps = createDependencyManagers();
        const manager = new TilemapManager(deps.tilesetManager as any, deps.rulesetManager as any, createProjectPathSystem());
        const deferred = createDeferred<any>();
        manager.addTilemapMetadata(createTilemapMetadata("tilemap-a"));
        (TilemapStorageService.load as any).mockReturnValue(deferred.promise);

        const firstPromise = manager.loadTilemap("tilemap-a");
        const secondPromise = manager.loadTilemap("tilemap-a");
        deferred.resolve(Result.Success(createTilemapData("tilemap-a")));
        const [first, second] = await Promise.all([firstPromise, secondPromise]);

        expect(first.status).toBe(Result.Status.Success);
        expect(second.status).toBe(Result.Status.Success);
        expect(second.data).toBe(first.data);
        expect(TilemapStorageService.load).toHaveBeenCalledTimes(1);
    });

    it("returns metadata-not-found when loading an unknown tilemap", async () => {
        const deps = createDependencyManagers();
        const manager = new TilemapManager(deps.tilesetManager as any, deps.rulesetManager as any, createProjectPathSystem());

        const result = await manager.loadTilemap("missing-tilemap");

        expect(result).toMatchObject({
            status: Result.Status.Error,
            message: { key: "message.tilemap.metadataNotFound" },
        });
        expect(TilemapStorageService.load).not.toHaveBeenCalled();
    });

    it("returns the storage error when storage loading fails", async () => {
        const deps = createDependencyManagers();
        const manager = new TilemapManager(deps.tilesetManager as any, deps.rulesetManager as any, createProjectPathSystem());
        manager.addTilemapMetadata(createTilemapMetadata("tilemap-a"));
        (TilemapStorageService.load as any).mockResolvedValue(Result.Error("storage failed"));

        const result = await manager.loadTilemap("tilemap-a");

        expect(result).toMatchObject({
            status: Result.Status.Error,
            message: { key: "storage failed" },
        });
    });

    it("saves a loaded tilemap and errors when the tilemap is not loaded", async () => {
        const deps = createDependencyManagers();
        const manager = new TilemapManager(deps.tilesetManager as any, deps.rulesetManager as any, createProjectPathSystem());
        const addResult = await manager.addTilemap(createTilemapData("tilemap-a"), "C:/Project/Metk/test-project/tilemaps/tilemap-a.json");
        addResult.data!.name = "Saved Map";

        expect((await manager.saveTilemap("tilemap-a")).status).toBe(Result.Status.Success);
        expect(TilemapStorageService.save).toHaveBeenCalledWith(
            "C:/Project/Metk/test-project/tilemaps/tilemap-a.json",
            expect.objectContaining({ id: "tilemap-a", name: "Saved Map" }),
        );

        expect(await manager.saveTilemap("missing-tilemap")).toMatchObject({
            status: Result.Status.Error,
            message: { key: "message.tilemap.notFound" },
        });
    });

    it("removes metadata and unloads a cached tilemap without deleting storage", async () => {
        const deps = createDependencyManagers();
        const manager = new TilemapManager(deps.tilesetManager as any, deps.rulesetManager as any, createProjectPathSystem());
        const addResult = await manager.addTilemap(createTilemapData("tilemap-a"), "C:/Project/Metk/test-project/tilemaps/tilemap-a.json");
        const unload = vi.spyOn(addResult.data!, "unload");

        const result = await manager.removeTilemapMetadata("tilemap-a");

        expect(result.status).toBe(Result.Status.Success);
        expect(unload).toHaveBeenCalledTimes(1);
        expect(manager.serialize()).toEqual([]);
        expect(TilemapStorageService.remove).not.toHaveBeenCalled();
    });

    it("deletes metadata and storage for an unloaded tilemap", async () => {
        const deps = createDependencyManagers();
        const manager = new TilemapManager(deps.tilesetManager as any, deps.rulesetManager as any, createProjectPathSystem());
        manager.addTilemapMetadata(createTilemapMetadata("tilemap-a"));

        const result = await manager.deleteTilemap("tilemap-a");

        expect(result.status).toBe(Result.Status.Success);
        expect(TilemapStorageService.remove).toHaveBeenCalledWith("C:/Project/Metk/test-project/tilemaps/tilemap-a.json");
        expect(manager.serialize()).toEqual([]);
    });

    it("keeps metadata when storage deletion fails", async () => {
        const deps = createDependencyManagers();
        const manager = new TilemapManager(deps.tilesetManager as any, deps.rulesetManager as any, createProjectPathSystem());
        manager.addTilemapMetadata(createTilemapMetadata("tilemap-a"));
        (TilemapStorageService.remove as any).mockResolvedValue(Result.Error("delete failed"));

        const result = await manager.deleteTilemap("tilemap-a");

        expect(result).toMatchObject({
            status: Result.Status.Error,
            message: { key: "message.tilemap.deleteFail" },
        });
        expect(manager.serialize()).toEqual([createTilemapMetadata("tilemap-a")]);
    });

    it("serializes loaded tilemaps with current model names and unloaded tilemaps from metadata", async () => {
        const deps = createDependencyManagers();
        const manager = new TilemapManager(deps.tilesetManager as any, deps.rulesetManager as any, createProjectPathSystem());
        manager.addTilemapMetadata(createTilemapMetadata("tilemap-b", { name: "Metadata B" }));
        const addResult = await manager.addTilemap(createTilemapData("tilemap-a"), "C:/Project/Metk/test-project/tilemaps/tilemap-a.json");
        addResult.data!.name = "Loaded Name";

        expect(manager.serialize()).toEqual([
            createTilemapMetadata("tilemap-b", { name: "Metadata B" }),
            { id: "tilemap-a", name: "Loaded Name", tilemapRelPath: "tilemaps/tilemap-a.json" },
        ]);
    });

    it("saves only loaded tilemaps affected by removed tileset references", async () => {
        const deps = createDependencyManagers();
        const manager = new TilemapManager(deps.tilesetManager as any, deps.rulesetManager as any, createProjectPathSystem());
        await manager.addTilemap(createTilemapData("affected-map", {
            tilesets: { refs: [{ id: "tileset-a", index: 0, name: "Tileset A" }], nextIndex: 1 },
        }), "C:/Project/Metk/test-project/tilemaps/affected-map.json");
        await manager.addTilemap(createTilemapData("untouched-map", {
            tilesets: { refs: [{ id: "tileset-b", index: 0, name: "Tileset B" }], nextIndex: 1 },
        }), "C:/Project/Metk/test-project/tilemaps/untouched-map.json");
        (TilemapStorageService.save as any).mockClear();

        await manager.removeTilesetRef("tileset-a");

        expect(TilemapStorageService.save).toHaveBeenCalledTimes(1);
        expect(TilemapStorageService.save).toHaveBeenCalledWith(
            "C:/Project/Metk/test-project/tilemaps/affected-map.json",
            expect.objectContaining({ id: "affected-map" }),
        );
    });

    it("saves only loaded tilemaps affected by removed ruleset references", async () => {
        const deps = createDependencyManagers();
        const manager = new TilemapManager(deps.tilesetManager as any, deps.rulesetManager as any, createProjectPathSystem());
        await manager.addTilemap(createTilemapData("affected-map", {
            rulesets: { refs: [{ id: "ruleset-a", index: 0, name: "Ruleset A" }], nextIndex: 1 },
        }), "C:/Project/Metk/test-project/tilemaps/affected-map.json");
        await manager.addTilemap(createTilemapData("untouched-map", {
            rulesets: { refs: [{ id: "ruleset-b", index: 0, name: "Ruleset B" }], nextIndex: 1 },
        }), "C:/Project/Metk/test-project/tilemaps/untouched-map.json");
        (TilemapStorageService.save as any).mockClear();

        await manager.removeRulesetRef("ruleset-a");

        expect(TilemapStorageService.save).toHaveBeenCalledTimes(1);
        expect(TilemapStorageService.save).toHaveBeenCalledWith(
            "C:/Project/Metk/test-project/tilemaps/affected-map.json",
            expect.objectContaining({ id: "affected-map" }),
        );
    });
});
