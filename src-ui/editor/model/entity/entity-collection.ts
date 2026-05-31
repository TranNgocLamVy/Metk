import { v4 as uuidv4 } from "uuid";

import { BaseObject, BaseObjectEvents, PropertyUpdateMeta } from "@/editor/model/base-object";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { FilePathSystem } from "@/infrastructure/project-path-system";
import { EntityCollectionData } from "@/shared/data-types/entity-collection.data";
import { EntityDefinitionData } from "@/shared/data-types/entity.data";
import { Result } from "@/shared/types/result";

import { EntityDefinition } from "./entity-definition";
import { normalizeEntityCollectionData, normalizeEntityDefinitionData } from "./entity.normalizer";
import { Console } from "@/shared/services/console.service";

export interface EntityCollectionEvent extends BaseObjectEvents {
    update: (collection: EntityCollection) => void;
    entityAdded: (entity: EntityDefinition) => void;
    entityRemoved: (entityId: string) => void;
    entityUpdated: (entityId: string) => void;
}

export class EntityCollection extends BaseObject<EntityCollectionEvent> {
    public readonly id: string;
    public name: string;
    public createdAt: string;
    public updatedAt: string;

    private entities: EntityDefinition[] = [];

    public constructor(
        data: EntityCollectionData,
        public readonly entityCollectionPathSystem: FilePathSystem,
        private readonly objectRegistry: EditorObjectRegistry,
    ) {
        super(`entity-collection:${data.id}`);

        this.id = data.id;
        this.name = data.name;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;

        this.entities = data.entities.map((entityData) => new EntityDefinition(entityData));
    }

    public static createFromFileData(fileData: unknown, entityCollectionPathSystem: FilePathSystem, objectRegistry: EditorObjectRegistry): Result<EntityCollection> {
        try {
            const data = normalizeEntityCollectionData(fileData);
            return Result.Success(new EntityCollection(data, entityCollectionPathSystem, objectRegistry));
        } catch (error) {
            return Result.Error(`Failed to create entity collection: ${String(error)}`);
        }
    }

    public override getObjectChildren(): BaseObject<any>[] {
        return this.entities;
    }

    public getAllEntityDefinitions(): EntityDefinition[] {
        return this.entities;
    }

    public getEntityDefinitionById(id: string): EntityDefinition | null {
        return this.entities.find((entity) => entity.id === id) ?? null;
    }

    public rename(name: string, meta?: PropertyUpdateMeta): Result {
        this.name = name;
        this.touch();

        this.emitUpdateProperty("name", this.name, {
            origin: meta?.origin ?? "external",
            source: meta?.source ?? "EntityCollection.rename",
        });

        this.eventEmitter.emit("update", this);

        return Result.Success();
    }

    public addEntityDefinition(entityData: Partial<EntityDefinitionData> = {}): EntityDefinition {
        const normalized = normalizeEntityDefinitionData(
            {
                id: uuidv4(),
                width: 1,
                height: 1,
                graphic: {
                    type: "color",
                    color: "#ffffff",
                },
                ...entityData,
            }
        );

        const entity = new EntityDefinition(normalized);
        this.entities.push(entity);

        if (this.objectRegistry.has(this.objectId)) {
            this.objectRegistry.registerTree(entity);
        }

        this.touch();
        this.eventEmitter.emit("entityAdded", entity);
        this.eventEmitter.emit("update", this);

        return entity;
    }

    public duplicateEntityDefinition(entityId: string): EntityDefinition | null {
        const entity = this.getEntityDefinitionById(entityId);
        if (!entity) return null;

        const entityData = entity.serialize();

        return this.addEntityDefinition({
            ...entityData,
            id: uuidv4(),
            name: `${entityData.name ?? entityData.id} Copy`,
        });
    }

    public removeEntityDefinition(entityId: string): boolean {
        const entity = this.getEntityDefinitionById(entityId);
        if (!entity) return false;

        this.objectRegistry.unregisterTree(entity);
        entity.destroy();

        this.entities = this.entities.filter((item) => item.id !== entityId);

        this.touch();
        this.eventEmitter.emit("entityRemoved", entityId);
        this.eventEmitter.emit("update", this);

        return true;
    }

    public updateEntityDefinition(entityData: EntityDefinitionData): boolean {
        const entity = this.getEntityDefinitionById(entityData.id);
        if (!entity) return false;

        entity.updateEntityDefinition(entityData);

        this.touch();
        this.eventEmitter.emit("entityUpdated", entity.id);
        this.eventEmitter.emit("update", this);

        return true;
    }

    public updateEntityCollection(fileData: EntityCollectionData): void {
        let data: EntityCollectionData;
        try {
            data = normalizeEntityCollectionData(fileData);
        } catch {
            Console.error({ message: "Failed to normalize entity collection data. Update aborted." });
            return;
        }

        if (data.id !== this.id) return;

        this.name = data.name;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;

        this.replaceEntities(data.entities ?? []);

        this.touch();
        this.eventEmitter.emit("update", this);
    }

    public serialize(): EntityCollectionData {
        return {
            id: this.id,
            name: this.name,
            entities: this.entities.map((entity) => entity.serialize()),
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    public touch(): void {
        this.updatedAt = new Date().toISOString();
    }

    public override destroy(): void {
        this.entities.forEach((entity) => entity.destroy());
        super.destroy();
    }

    private replaceEntities(nextEntityData: EntityDefinitionData[]): void {
        const currentEntitiesById = new Map(
            this.entities.map((entity) => [entity.id, entity]),
        );

        const nextEntityIds = new Set(nextEntityData.map((entity) => entity.id));

        for (const entity of this.entities) {
            if (!nextEntityIds.has(entity.id)) {
                this.objectRegistry.unregisterTree(entity);
                entity.destroy();
            }
        }

        const shouldRegisterNewEntities = this.objectRegistry.has(this.objectId);

        this.entities = nextEntityData.map((entityData) => {
            const existingEntity = currentEntitiesById.get(entityData.id);

            if (existingEntity) {
                existingEntity.updateEntityDefinition(entityData);
                return existingEntity;
            }

            const entity = new EntityDefinition(entityData);

            if (shouldRegisterNewEntities) {
                this.objectRegistry.registerTree(entity);
            }

            return entity;
        });
    }
}