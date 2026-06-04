import { beforeEach, describe, expect, it, vi } from "vitest";

const storageState = vi.hoisted(() => ({
    EntityCollectionStorageService: {
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

import { EntityCollectionManager } from "@/application/resources/entity/entity-collection.manager";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { EntityCollectionStorageService } from "@/infrastructure/container";
import { EntityFieldType } from "@/shared/data-types/entity.data";
import { Result } from "@/shared/types/result";

import {
    createEntityCollectionData,
    createObjectRegistry,
    createProjectPathSystem,
} from "./resource-manager-test-utils";

const createTilesetManager = () => ({
    loadTilesets: vi.fn(async () => []),
    getTilesetMetadataById: vi.fn((id: string) => ({ id, name: `${id} metadata`, tilesetRelPath: `tilesets/${id}.json` })),
});

describe("EntityCollectionManager clone behavior", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (EntityCollectionStorageService.load as any).mockResolvedValue(Result.Success(createEntityCollectionData()));
        (EntityCollectionStorageService.save as any).mockResolvedValue(Result.Success());
        (EntityCollectionStorageService.remove as any).mockResolvedValue(Result.Success());
    });

    it("deep-clones a loaded entity collection as an unregistered temporary copy preserving root and child ids", async () => {
        const objectRegistry = new EditorObjectRegistry();
        const manager = new EntityCollectionManager(createTilesetManager() as any, createProjectPathSystem(), objectRegistry);
        const addResult = await manager.addEntityCollection(createEntityCollectionData("collection-a", {
            entities: [{
                id: "entity-a",
                name: "Entity A",
                width: 1,
                height: 1,
                graphic: { type: "color", color: "#ffffff" },
                fields: [{ id: "field-a", name: "Target", type: EntityFieldType.EntityRef, value: "entity-a" }],
            }],
        }), "C:/Project/Metk/test-project/entities/collection-a.json");
        const loadedCollection = addResult.data!;

        const clone = manager.deepCloneEntityCollection("collection-a");

        expect(clone).not.toBeNull();
        expect(clone).not.toBe(loadedCollection);
        expect(clone?.id).toBe("collection-a");
        expect(clone?.objectId).toBe("entity-collection:collection-a");
        expect(clone?.getEntityDefinitionById("entity-a")?.objectId).toBe("entity-definition:entity-a");
        expect(clone?.serialize()).toEqual(loadedCollection.serialize());
        expect(objectRegistry.get(clone!.objectId)).toBe(loadedCollection);
        expect(objectRegistry.get(clone!.getEntityDefinitionById("entity-a")!.objectId)).toBe(loadedCollection.getEntityDefinitionById("entity-a"));
        expect(manager.deepCloneEntityCollection("missing-collection")).toBeNull();
    });

    it("clones a loaded entity collection with new ids, cloneFrom metadata, remapped entity field refs, and registry-safe objectIds", async () => {
        const objectRegistry = createObjectRegistry();
        const manager = new EntityCollectionManager(createTilesetManager() as any, createProjectPathSystem(), objectRegistry);
        await manager.addEntityCollection(createEntityCollectionData("collection-a", {
            entities: [
                {
                    id: "entity-a",
                    name: "Entity A",
                    width: 1,
                    height: 1,
                    graphic: { type: "color", color: "#ffffff" },
                    fields: [{ id: "field-a", name: "Target", type: EntityFieldType.EntityRef, value: "entity-b" }],
                },
                {
                    id: "entity-b",
                    name: "Entity B",
                    width: 1,
                    height: 1,
                    graphic: { type: "color", color: "#000000" },
                    fields: [],
                },
            ],
        }), "C:/Project/Metk/test-project/entities/collection-a.json");

        const clone = manager.cloneEntityCollection("collection-a");
        const clonedData = clone!.serialize();
        const clonedEntityA = clonedData.entities.find((entity) => entity.cloneFrom === "entity-a")!;
        const clonedEntityB = clonedData.entities.find((entity) => entity.cloneFrom === "entity-b")!;
        const clonedFieldA = clonedEntityA.fields![0];

        expect(clone).not.toBeNull();
        expect(clonedData.id).not.toBe("collection-a");
        expect(clonedData.cloneFrom).toBe("collection-a");
        expect(clonedEntityA.id).not.toBe("entity-a");
        expect(clonedEntityB.id).not.toBe("entity-b");
        expect(clonedFieldA.id).not.toBe("field-a");
        expect(clonedFieldA.cloneFrom).toBe("field-a");
        expect(clonedFieldA.value).toBe(clonedEntityB.id);
        expect(clone!.objectId).toBe(`entity-collection:${clonedData.id}`);
        expect(clone!.getEntityDefinitionById(clonedEntityA.id)?.objectId).toBe(`entity-definition:${clonedEntityA.id}`);
        expect(() => objectRegistry.registerTree(clone!)).not.toThrow();
    });
});
