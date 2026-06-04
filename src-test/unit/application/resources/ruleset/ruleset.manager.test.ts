import { beforeEach, describe, expect, it, vi } from "vitest";

const storageState = vi.hoisted(() => ({
    RulesetStorageService: {
        load: vi.fn(),
        save: vi.fn(),
        remove: vi.fn(),
    },
}));

vi.mock("@/infrastructure/container", () => storageState);
vi.mock("@/ui/notifications/console-gateway", () => ({
    Console: {
        log: vi.fn(),
        success: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    },
}));

import { RulesetManager } from "@/application/resources/ruleset/ruleset.manager";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { RulesetStorageService } from "@/infrastructure/container";
import { Result } from "@/shared/types/result";

import {
    createDeferred,
    createObjectRegistry,
    createProjectPathSystem,
    createRulesetData,
    createRulesetMetadata,
} from "../resource-manager-test-utils";

const createTilesetManager = () => ({
    loadTilesets: vi.fn(async () => []),
    getTilesetMetadataById: vi.fn((id: string) => ({ id, name: `${id} metadata`, tilesetRelPath: `tilesets/${id}.json` })),
});

describe("RulesetManager", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (RulesetStorageService.load as any).mockResolvedValue(Result.Success(createRulesetData()));
        (RulesetStorageService.save as any).mockResolvedValue(Result.Success());
        (RulesetStorageService.remove as any).mockResolvedValue(Result.Success());
    });

    it("adds a ruleset, stores metadata, caches the loaded model, loads dependencies, and emits manager updates", async () => {
        const tilesetManager = createTilesetManager();
        const manager = new RulesetManager(tilesetManager as any, createProjectPathSystem(), createObjectRegistry());
        manager.addRulesetMetadata(createRulesetMetadata("ruleset-a"));
        const loadRulesets = vi.spyOn(manager, "loadRulesets").mockResolvedValue([]);
        const updated = vi.fn();
        manager.on("onRulesetManagerUpdated", updated);
        const rulesetData = createRulesetData("ruleset-a", {
            name: "Terrain",
            color: "#00ff00",
            tilesets: { refs: [{ id: "tileset-a", index: 0, name: "Tileset A" }], nextIndex: 1 },
            rulesets: {
                refs: [
                    { id: "ruleset-a", index: 0, name: "Self" },
                    { id: "ruleset-b", index: 1, name: "Dependency" },
                ],
                nextIndex: 2,
            },
        });

        const result = await manager.addRuleset(rulesetData, "C:/Project/Metk/test-project/rulesets/terrain.json");

        expect(result.status).toBe(Result.Status.Success);
        expect(manager.getRulesetById("ruleset-a")).toBe(result.data!);
        expect(tilesetManager.loadTilesets).toHaveBeenCalledWith(["tileset-a"]);
        expect(loadRulesets).toHaveBeenCalledWith(["ruleset-b"]);
        expect(updated).toHaveBeenCalledWith(manager.serialize());
        expect(manager.serialize()).toEqual([{
            id: "ruleset-a",
            name: "Terrain",
            color: "#00ff00",
            rulesetRelPath: "rulesets/terrain.json",
        }]);
    });

    it("registers loaded rulesets with rules and unregisters removed rules before destroying them", async () => {
        const objectRegistry = new EditorObjectRegistry();
        const manager = new RulesetManager(createTilesetManager() as any, createProjectPathSystem(), objectRegistry);
        manager.addRulesetMetadata(createRulesetMetadata("ruleset-a"));
        await manager.addRuleset(createRulesetData("ruleset-a", {
            rules: [
                { id: "rule-a", constraints: "", outputs: "" },
                { id: "rule-b", constraints: "", outputs: "" },
            ],
        }), "C:/Project/Metk/test-project/rulesets/ruleset-a.json");
        const ruleset = manager.getRulesetById("ruleset-a")!;
        const ruleA = ruleset.getRule("rule-a")!;
        const ruleB = ruleset.getRule("rule-b")!;
        const ruleBDestroy = vi.spyOn(ruleB, "destroy");

        expect(objectRegistry.has(ruleset.objectId)).toBe(true);
        expect(ruleA.objectId).toBe("ruleset:ruleset-a:rule:rule-a");
        expect(objectRegistry.has(ruleA.objectId)).toBe(true);
        expect(objectRegistry.has(ruleB.objectId)).toBe(true);

        manager.updateRuleset(createRulesetData("ruleset-a", {
            rules: [
                { id: "rule-a", constraints: "", outputs: "" },
                { id: "rule-c", constraints: "", outputs: "" },
            ],
        }));

        const ruleC = ruleset.getRule("rule-c")!;
        expect(objectRegistry.has(ruleA.objectId)).toBe(true);
        expect(objectRegistry.has(ruleB.objectId)).toBe(false);
        expect(ruleBDestroy).toHaveBeenCalledTimes(1);
        expect(ruleB.destroyed).toBe(true);
        expect(ruleC.objectId).toBe("ruleset:ruleset-a:rule:rule-c");
        expect(objectRegistry.has(ruleC.objectId)).toBe(true);
    });

    it("loads a ruleset from storage and then serves cache hits without reading storage again", async () => {
        const tilesetManager = createTilesetManager();
        const manager = new RulesetManager(tilesetManager as any, createProjectPathSystem(), createObjectRegistry());
        manager.addRulesetMetadata(createRulesetMetadata("ruleset-a"));
        (RulesetStorageService.load as any).mockResolvedValue(Result.Success(createRulesetData("ruleset-a")));

        const first = await manager.loadRuleset("ruleset-a");
        const second = await manager.loadRuleset("ruleset-a");

        expect(first.status).toBe(Result.Status.Success);
        expect(second.status).toBe(Result.Status.Success);
        expect(second.data).toBe(first.data);
        expect(RulesetStorageService.load).toHaveBeenCalledTimes(1);
        expect(RulesetStorageService.load).toHaveBeenCalledWith("C:/Project/Metk/test-project/rulesets/ruleset-a.json");
    });

    it("deduplicates concurrent pending loads for the same ruleset", async () => {
        const tilesetManager = createTilesetManager();
        const manager = new RulesetManager(tilesetManager as any, createProjectPathSystem(), createObjectRegistry());
        const deferred = createDeferred<any>();
        manager.addRulesetMetadata(createRulesetMetadata("ruleset-a"));
        (RulesetStorageService.load as any).mockReturnValue(deferred.promise);

        const firstPromise = manager.loadRuleset("ruleset-a");
        const secondPromise = manager.loadRuleset("ruleset-a");
        deferred.resolve(Result.Success(createRulesetData("ruleset-a")));
        const [first, second] = await Promise.all([firstPromise, secondPromise]);

        expect(first.status).toBe(Result.Status.Success);
        expect(second.status).toBe(Result.Status.Success);
        expect(second.data).toBe(first.data);
        expect(RulesetStorageService.load).toHaveBeenCalledTimes(1);
    });

    it("returns metadata-not-found when loading an unknown ruleset", async () => {
        const manager = new RulesetManager(createTilesetManager() as any, createProjectPathSystem(), createObjectRegistry());

        const result = await manager.loadRuleset("missing-ruleset");

        expect(result).toMatchObject({
            status: Result.Status.Error,
            message: { key: "message.ruleset.metadataNotFound" },
        });
        expect(RulesetStorageService.load).not.toHaveBeenCalled();
    });

    it("returns the storage error when storage loading fails", async () => {
        const manager = new RulesetManager(createTilesetManager() as any, createProjectPathSystem(), createObjectRegistry());
        manager.addRulesetMetadata(createRulesetMetadata("ruleset-a"));
        (RulesetStorageService.load as any).mockResolvedValue(Result.Error("storage failed"));

        const result = await manager.loadRuleset("ruleset-a");

        expect(result).toMatchObject({
            status: Result.Status.Error,
            message: { key: "storage failed" },
        });
        expect(manager.getRulesetById("ruleset-a")).toBeNull();
    });

    it("saves a loaded ruleset and errors when the ruleset is not loaded", async () => {
        const manager = new RulesetManager(createTilesetManager() as any, createProjectPathSystem(), createObjectRegistry());
        manager.addRulesetMetadata(createRulesetMetadata("ruleset-a"));
        const addResult = await manager.addRuleset(createRulesetData("ruleset-a"), "C:/Project/Metk/test-project/rulesets/ruleset-a.json");
        addResult.data!.updateRuleset(createRulesetData("ruleset-a", { name: "Saved Ruleset" }));

        expect((await manager.saveRuleset("ruleset-a")).status).toBe(Result.Status.Success);
        expect(RulesetStorageService.save).toHaveBeenCalledWith(
            "C:/Project/Metk/test-project/rulesets/ruleset-a.json",
            expect.objectContaining({ id: "ruleset-a", name: "Saved Ruleset" }),
        );

        expect(await manager.saveRuleset("missing-ruleset")).toMatchObject({
            status: Result.Status.Error,
            message: { key: "message.ruleset.notFound", options: { id: "missing-ruleset" } },
        });
    });

    it("updates a loaded ruleset, emits update events, and ignores mismatched or missing updates", async () => {
        const manager = new RulesetManager(createTilesetManager() as any, createProjectPathSystem(), createObjectRegistry());
        manager.addRulesetMetadata(createRulesetMetadata("ruleset-a"));
        await manager.addRuleset(createRulesetData("ruleset-a"), "C:/Project/Metk/test-project/rulesets/ruleset-a.json");
        const managerUpdated = vi.fn();
        const rulesetUpdated = vi.fn();
        manager.on("onRulesetManagerUpdated", managerUpdated);
        manager.on("onRulesetUpdated", rulesetUpdated);

        manager.updateRuleset(createRulesetData("ruleset-a", { name: "Updated", color: "#ff00ff" }));
        manager.updateRuleset(createRulesetData("missing-ruleset", { name: "Missing" }));

        expect(manager.getRulesetById("ruleset-a")?.name).toBe("Updated");
        expect(manager.serialize()).toEqual([{
            id: "ruleset-a",
            name: "Updated",
            color: "#ff00ff",
            rulesetRelPath: "rulesets/ruleset-a.json",
        }]);
        expect(managerUpdated).toHaveBeenCalledTimes(1);
        expect(rulesetUpdated).toHaveBeenCalledWith("ruleset-a");
    });

    it("removes loaded metadata without deleting storage and emits manager updates", async () => {
        const manager = new RulesetManager(createTilesetManager() as any, createProjectPathSystem(), createObjectRegistry());
        manager.addRulesetMetadata(createRulesetMetadata("ruleset-a"));
        const addResult = await manager.addRuleset(createRulesetData("ruleset-a"), "C:/Project/Metk/test-project/rulesets/ruleset-a.json");
        const destroy = vi.spyOn(addResult.data!, "destroy");
        const updated = vi.fn();
        manager.on("onRulesetManagerUpdated", updated);

        const result = await manager.removeRuleset("ruleset-a");

        expect(result.status).toBe(Result.Status.Success);
        expect(destroy).toHaveBeenCalledTimes(1);
        expect(manager.getRulesetById("ruleset-a")).toBeNull();
        expect(manager.getRulesetMetadataById("ruleset-a")).toBeNull();
        expect(RulesetStorageService.remove).not.toHaveBeenCalled();
        expect(updated).toHaveBeenCalledWith([]);
    });

    it("deletes metadata and storage for an unloaded ruleset", async () => {
        const manager = new RulesetManager(createTilesetManager() as any, createProjectPathSystem(), createObjectRegistry());
        manager.addRulesetMetadata(createRulesetMetadata("ruleset-a"));

        const result = await manager.deleteRuleset("ruleset-a");

        expect(result.status).toBe(Result.Status.Success);
        expect(RulesetStorageService.remove).toHaveBeenCalledWith("C:/Project/Metk/test-project/rulesets/ruleset-a.json");
        expect(manager.serialize()).toEqual([]);
    });

    it("keeps metadata when storage deletion fails", async () => {
        const manager = new RulesetManager(createTilesetManager() as any, createProjectPathSystem(), createObjectRegistry());
        manager.addRulesetMetadata(createRulesetMetadata("ruleset-a"));
        (RulesetStorageService.remove as any).mockResolvedValue(Result.Error("delete failed"));

        const result = await manager.deleteRuleset("ruleset-a");

        expect(result).toMatchObject({
            status: Result.Status.Error,
            message: { key: "message.ruleset.deleteFail" },
        });
        expect(manager.serialize()).toEqual([createRulesetMetadata("ruleset-a")]);
    });

    it("deep-clones a loaded ruleset without registering the temporary clone and returns null when deep-cloning an unloaded ruleset", async () => {
        const objectRegistry = new EditorObjectRegistry();
        const manager = new RulesetManager(createTilesetManager() as any, createProjectPathSystem(), objectRegistry);
        manager.addRulesetMetadata(createRulesetMetadata("ruleset-a"));
        await manager.addRuleset(createRulesetData("ruleset-a", {
            rules: [{ id: "rule-a", constraints: "", outputs: "" }],
        }), "C:/Project/Metk/test-project/rulesets/ruleset-a.json");
        const loadedRuleset = manager.getRulesetById("ruleset-a")!;

        const clone = manager.deepCloneRuleset("ruleset-a");

        expect(clone).not.toBeNull();
        expect(clone).not.toBe(loadedRuleset);
        expect(clone?.serialize()).toEqual(loadedRuleset.serialize());
        expect(objectRegistry.get(clone!.objectId)).toBe(loadedRuleset);
        expect(objectRegistry.get(clone!.getRule("rule-a")!.objectId)).toBe(loadedRuleset.getRule("rule-a"));
        expect(manager.deepCloneRuleset("missing-ruleset")).toBeNull();
    });

    it("clones a loaded ruleset with new ids, cloneFrom metadata, and registry-safe objectIds", async () => {
        const objectRegistry = new EditorObjectRegistry();
        const manager = new RulesetManager(createTilesetManager() as any, createProjectPathSystem(), objectRegistry);
        manager.addRulesetMetadata(createRulesetMetadata("ruleset-a"));
        await manager.addRuleset(createRulesetData("ruleset-a", {
            rulesets: { refs: [{ id: "ruleset-a", index: 0, name: "Self" }], nextIndex: 1 },
            rules: [{ id: "rule-a", constraints: "", outputs: "" }],
        }), "C:/Project/Metk/test-project/rulesets/ruleset-a.json");

        const clone = manager.cloneRuleset("ruleset-a");
        const clonedData = clone!.serialize();

        expect(clone).not.toBeNull();
        expect(clonedData.id).not.toBe("ruleset-a");
        expect(clonedData.cloneFrom).toBe("ruleset-a");
        expect(clonedData.rules[0].id).not.toBe("rule-a");
        expect(clonedData.rules[0].cloneFrom).toBe("rule-a");
        expect(clonedData.rulesets.refs[0].id).toBe(clonedData.id);
        expect(clone!.objectId).toBe(`ruleset:${clonedData.id}`);
        expect(clone!.getRule(clonedData.rules[0].id)?.objectId).toBe(`ruleset:${clonedData.id}:rule:${clonedData.rules[0].id}`);
        expect(() => objectRegistry.registerTree(clone!)).not.toThrow();
    });

    it("saves only loaded rulesets affected by removed tileset references", async () => {
        const manager = new RulesetManager(createTilesetManager() as any, createProjectPathSystem(), createObjectRegistry());
        manager.addRulesetMetadata(createRulesetMetadata("affected-ruleset"));
        manager.addRulesetMetadata(createRulesetMetadata("untouched-ruleset"));
        await manager.addRuleset(createRulesetData("affected-ruleset", {
            tilesets: { refs: [{ id: "tileset-a", index: 0, name: "Tileset A" }], nextIndex: 1 },
        }), "C:/Project/Metk/test-project/rulesets/affected-ruleset.json");
        await manager.addRuleset(createRulesetData("untouched-ruleset", {
            tilesets: { refs: [{ id: "tileset-b", index: 0, name: "Tileset B" }], nextIndex: 1 },
        }), "C:/Project/Metk/test-project/rulesets/untouched-ruleset.json");
        (RulesetStorageService.save as any).mockClear();

        await manager.removeTilesetRef("tileset-a");

        expect(RulesetStorageService.save).toHaveBeenCalledTimes(1);
        expect(RulesetStorageService.save).toHaveBeenCalledWith(
            "C:/Project/Metk/test-project/rulesets/affected-ruleset.json",
            expect.objectContaining({ id: "affected-ruleset" }),
        );
    });

    it("saves only loaded rulesets affected by removed ruleset references", async () => {
        const manager = new RulesetManager(createTilesetManager() as any, createProjectPathSystem(), createObjectRegistry());
        manager.addRulesetMetadata(createRulesetMetadata("affected-ruleset"));
        manager.addRulesetMetadata(createRulesetMetadata("untouched-ruleset"));
        await manager.addRuleset(createRulesetData("affected-ruleset", {
            rulesets: {
                refs: [
                    { id: "affected-ruleset", index: 0, name: "Self" },
                    { id: "ruleset-a", index: 1, name: "Ruleset A" },
                ],
                nextIndex: 2,
            },
        }), "C:/Project/Metk/test-project/rulesets/affected-ruleset.json");
        await manager.addRuleset(createRulesetData("untouched-ruleset", {
            rulesets: {
                refs: [
                    { id: "untouched-ruleset", index: 0, name: "Self" },
                    { id: "ruleset-b", index: 1, name: "Ruleset B" },
                ],
                nextIndex: 2,
            },
        }), "C:/Project/Metk/test-project/rulesets/untouched-ruleset.json");
        (RulesetStorageService.save as any).mockClear();

        await manager.removeRulesetRef("ruleset-a");

        expect(RulesetStorageService.save).toHaveBeenCalledTimes(1);
        expect(RulesetStorageService.save).toHaveBeenCalledWith(
            "C:/Project/Metk/test-project/rulesets/affected-ruleset.json",
            expect.objectContaining({ id: "affected-ruleset" }),
        );
    });
});
