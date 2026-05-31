import EventEmitter from "eventemitter3";

import { FilePathSystem, ProjectPathSystem } from "@/infrastructure/project-path-system";
import { EntityCollectionStorageService } from "@/infrastructure/container";
import { EditorObjectRegistry } from "@/editor/registry/editor-object.registry";
import { EntityCollection } from "@/editor/model/entity/entity-collection";
import { EntityDefinition } from "@/editor/model/entity/entity-definition";
import { EntityCollectionData, EntityCollectionMetadata } from "@/shared/data-types/entity-collection.data";
import { PathUtils } from "@/shared/utils/path.utils";
import { Result } from "@/shared/types/result";
import { Console } from "@/shared/services/console.service";
import { normalizeEntityCollectionData } from "@/editor/model/entity/entity.normalizer";
import { TilesetManager } from "../tileset/tileset.manager";
import { TilesetRefManager } from "../references/tileset-ref.manager";

export interface EntityCollectionManagerEvent {
    onEntityCollectionManagerUpdated: (entityCollections: EntityCollectionMetadata[]) => void;
    onEntityCollectionUpdated: (entityCollectionId: string) => void;
}

export class EntityCollectionManager extends EventEmitter<EntityCollectionManagerEvent> {
    public readonly entityCollectionMetadata: Map<string, EntityCollectionMetadata> = new Map<string, EntityCollectionMetadata>();
    private loadedEntityCollections: Map<string, EntityCollection> = new Map<string, EntityCollection>();
    private pendingLoads: Map<string, Promise<Result<EntityCollection>>> = new Map<string, Promise<Result<EntityCollection>>>();
    private entityDefinitionIndex: Map<string, string> = new Map<string, string>();

    public constructor(
        private readonly tilesetManager: TilesetManager,
        private readonly projectPathSystem: ProjectPathSystem,
        private readonly objectRegistry: EditorObjectRegistry,
    ) {
        super();
    }

    public addEntityCollectionMetadata(metadata: EntityCollectionMetadata): void {
        this.entityCollectionMetadata.set(metadata.id, metadata);
        this.emitManagerUpdated();
    }

    public loadEntityCollectionsMetadata(metadata: EntityCollectionMetadata[]): void {
        metadata.forEach((item) => {
            this.entityCollectionMetadata.set(item.id, item);
        });
        this.emitManagerUpdated();
    }

    public async addEntityCollection(entityCollection: unknown, entityCollectionAbsPath: string): Promise<Result<EntityCollection>> {
        let entityCollectionData: EntityCollectionData;

        try {
            entityCollectionData = normalizeEntityCollectionData(entityCollection);
        } catch (error) {
            return Result.Error(`Failed to create entity collection: ${String(error)}`);
        }

        const entityCollectionRelPath = PathUtils.relative(this.projectPathSystem.absDir, entityCollectionAbsPath);

        if (this.loadedEntityCollections.has(entityCollectionData.id)) {
            await this.unloadEntityCollection(entityCollectionData.id);
        }

        const entityCollectionPathSystem = new FilePathSystem(
            entityCollectionData.id,
            this.projectPathSystem,
            entityCollectionRelPath,
        );
        const tilesetRefManager = new TilesetRefManager(
            this.tilesetManager,
            entityCollectionPathSystem,
        );

        const newEntityCollection = new EntityCollection(
            entityCollectionData,
            entityCollectionPathSystem,
            tilesetRefManager,
            this.objectRegistry,
        );

        const metadata: EntityCollectionMetadata = {
            id: newEntityCollection.id,
            name: newEntityCollection.name,
            entityCollectionRelPath,
        };

        this.entityCollectionMetadata.set(newEntityCollection.id, metadata);
        this.loadedEntityCollections.set(
            newEntityCollection.id,
            newEntityCollection,
        );

        this.objectRegistry.registerTree(newEntityCollection);
        this.rebuildEntityDefinitionIndex();
        await this.tilesetManager.loadTilesets(newEntityCollection.tilesetRefManager.getRefIds());
        this.emitManagerUpdated();

        return Result.Success(newEntityCollection);
    }

    public async loadEntityCollections(ids: string[]): Promise<Result<EntityCollection>[]> {
        return await Promise.all(
            ids.map((id) => this.loadEntityCollection(id)),
        );
    }

    public async loadAllEntityCollections(): Promise<Result<EntityCollection>[]> {
        return await this.loadEntityCollections(Array.from(this.entityCollectionMetadata.keys()));
    }

    public async loadEntityCollection(id: string): Promise<Result<EntityCollection>> {
        if (this.loadedEntityCollections.has(id)) {
            return Result.Success(this.loadedEntityCollections.get(id)!);
        }

        if (this.pendingLoads.has(id)) {
            return this.pendingLoads.get(id)!;
        }

        const loadPromise = this.performEntityCollectionLoad(id);
        this.pendingLoads.set(id, loadPromise);

        try {
            return await loadPromise;
        } finally {
            this.pendingLoads.delete(id);
        }
    }

    private async performEntityCollectionLoad(id: string): Promise<Result<EntityCollection>> {
        const metadata = this.entityCollectionMetadata.get(id);

        if (!metadata) {
            Console.error({
                message: {
                    key: "message.entityCollection.loadFail",
                    options: { name: "Unknown", id },
                },
                stacks: ["message.entityCollection.metadataNotFound"],
            }, `loadEntityCollectionFail:${id}`);

            return Result.Error("message.entityCollection.metadataNotFound");
        }

        const entityCollectionAbsPath = this.projectPathSystem.getAbsPathFromRelPath(
            metadata.entityCollectionRelPath,
        );

        const loadResult = await EntityCollectionStorageService.load(
            entityCollectionAbsPath,
        );

        if (loadResult.status !== Result.Status.Success) {
            Console.error({
                message: {
                    key: "message.entityCollection.loadFail",
                    options: { name: metadata.name, id },
                },
                stacks: loadResult.message ? [loadResult.message] : [],
            }, `loadEntityCollectionFail:${id}`);

            return Result.Error(loadResult.message);
        }

        return await this.addEntityCollection(
            loadResult.data,
            entityCollectionAbsPath,
        );
    }

    public async unloadEntityCollection(entityCollectionId: string): Promise<void> {
        const entityCollection = this.loadedEntityCollections.get(entityCollectionId);
        if (!entityCollection) return;

        this.objectRegistry.unregisterTree(entityCollection);
        entityCollection.destroy();

        this.loadedEntityCollections.delete(entityCollectionId);
        this.pendingLoads.delete(entityCollectionId);

        this.rebuildEntityDefinitionIndex();
    }

    public async saveEntityCollection(entityCollectionId: string): Promise<Result> {
        const entityCollection = this.loadedEntityCollections.get(entityCollectionId);

        if (!entityCollection) {
            return Result.Error({
                key: "message.entityCollection.notFound",
                options: { id: entityCollectionId },
            });
        }

        const entityCollectionData = entityCollection.serialize();

        return EntityCollectionStorageService.save(
            entityCollection.entityCollectionPathSystem.getFileAbsPath(),
            entityCollectionData,
        );
    }

    public getEntityCollectionById(entityCollectionId: string): EntityCollection | null {
        return this.loadedEntityCollections.get(entityCollectionId) ?? null;
    }

    public getEntityCollectionMetadataById(entityCollectionId: string): EntityCollectionMetadata | null {
        return this.entityCollectionMetadata.get(entityCollectionId) ?? null;
    }

    public getEntityDefinitionById(entityDefinitionId: string): EntityDefinition | null {
        const entityCollectionId = this.entityDefinitionIndex.get(
            entityDefinitionId,
        );

        if (!entityCollectionId) return null;

        const entityCollection = this.loadedEntityCollections.get(
            entityCollectionId,
        );

        if (!entityCollection) return null;

        return entityCollection.getEntityDefinitionById(entityDefinitionId);
    }

    public updateEntityCollection(entityCollectionData: EntityCollectionData): void {
        const normalized = normalizeEntityCollectionData(entityCollectionData);

        const entityCollection = this.loadedEntityCollections.get(
            normalized.id,
        );

        if (!entityCollection) return;

        entityCollection.updateEntityCollection(normalized);

        const metadata = this.entityCollectionMetadata.get(normalized.id);

        if (metadata) {
            metadata.name = normalized.name;
        }

        this.rebuildEntityDefinitionIndex();
        this.emitManagerUpdated();
        this.emit("onEntityCollectionUpdated", normalized.id);

        Console.success({
            message: {
                key: "message.entityCollection.updatedSuccess",
                options: { name: normalized.name },
            },
        });
    }

    public notifyEntityCollectionUpdated(entityCollectionId: string): void {
        const entityCollection = this.loadedEntityCollections.get(entityCollectionId);
        if (!entityCollection) return;

        const metadata = this.entityCollectionMetadata.get(entityCollectionId);
        if (metadata) {
            metadata.name = entityCollection.name;
        }

        this.rebuildEntityDefinitionIndex();
        this.emitManagerUpdated();
        this.emit("onEntityCollectionUpdated", entityCollectionId);
    }

    public async removeEntityCollection(entityCollectionId: string): Promise<Result> {
        const metadata = this.entityCollectionMetadata.get(entityCollectionId);

        if (!metadata) {
            return Result.Error({
                key: "message.entityCollection.metadataNotFound",
                options: { id: entityCollectionId },
            });
        }

        if (this.loadedEntityCollections.has(entityCollectionId)) {
            await this.unloadEntityCollection(entityCollectionId);
        }

        this.entityCollectionMetadata.delete(entityCollectionId);
        this.loadedEntityCollections.delete(entityCollectionId);
        this.pendingLoads.delete(entityCollectionId);

        this.rebuildEntityDefinitionIndex();
        this.emitManagerUpdated();

        Console.log({
            message: {
                key: "message.entityCollection.removeSuccess",
                options: { name: metadata.name },
            },
        });

        return Result.Success();
    }

    public async deleteEntityCollection(entityCollectionId: string): Promise<Result> {
        const metadata = this.entityCollectionMetadata.get(entityCollectionId);

        if (!metadata) {
            Console.error({
                message: "message.entityCollection.deleteFail",
                stacks: ["message.entityCollection.metadataNotFound"],
            });

            return Result.Error({
                key: "message.entityCollection.metadataNotFound",
                options: { id: entityCollectionId },
            });
        }

        if (this.loadedEntityCollections.has(entityCollectionId)) {
            await this.unloadEntityCollection(entityCollectionId);
        }

        const entityCollectionAbsPath = this.projectPathSystem.getAbsPathFromRelPath(metadata.entityCollectionRelPath);

        const deletionResult = await EntityCollectionStorageService.remove(
            entityCollectionAbsPath,
        );

        if (deletionResult.status !== Result.Status.Success) {
            Console.error({
                message: "message.entityCollection.deleteFail",
                stacks: [
                    deletionResult.message!,
                    ...deletionResult.stacks!,
                ],
            });

            return Result.Error(
                "message.entityCollection.deleteFail",
                deletionResult,
            );
        }

        this.entityCollectionMetadata.delete(entityCollectionId);
        this.loadedEntityCollections.delete(entityCollectionId);
        this.pendingLoads.delete(entityCollectionId);

        this.rebuildEntityDefinitionIndex();
        this.emitManagerUpdated();

        Console.log({
            message: {
                key: "message.entityCollection.deleteSuccess",
                options: { name: metadata.name },
            },
        });

        return Result.Success();
    }

    public cloneEntityCollection(entityCollectionId: string): EntityCollection | null {
        const entityCollection = this.loadedEntityCollections.get(entityCollectionId);
        if (!entityCollection) return null;

        const entityCollectionData = entityCollection.serialize();

        const entityCollectionPathSystem = new FilePathSystem(
            entityCollectionData.id,
            this.projectPathSystem,
            entityCollection.entityCollectionPathSystem.relPath,
        );
        const tilesetRefManager = new TilesetRefManager(
            this.tilesetManager,
            entityCollectionPathSystem,
        );

        const cloneRegistry = new EditorObjectRegistry();

        return new EntityCollection(entityCollectionData, entityCollectionPathSystem, tilesetRefManager, cloneRegistry);
    }

    public serialize(): EntityCollectionMetadata[] {
        return Array.from(this.entityCollectionMetadata.values()).map(
            (metadata) => {
                const entityCollection = this.loadedEntityCollections.get(
                    metadata.id,
                );

                if (!entityCollection) return metadata;

                return {
                    id: entityCollection.id,
                    name: entityCollection.name,
                    entityCollectionRelPath:
                        entityCollection.entityCollectionPathSystem.relPath,
                };
            },
        );
    }

    public async destroy(): Promise<void> {
        for (const entityCollection of this.loadedEntityCollections.values()) {
            this.objectRegistry.unregisterTree(entityCollection);
            entityCollection.destroy();
        }

        this.loadedEntityCollections.clear();
        this.pendingLoads.clear();
        this.entityDefinitionIndex.clear();
        this.removeAllListeners();
    }

    private rebuildEntityDefinitionIndex(): void {
        this.entityDefinitionIndex.clear();

        for (const entityCollection of this.loadedEntityCollections.values()) {
            for (const entity of entityCollection.getAllEntityDefinitions()) {
                this.entityDefinitionIndex.set(entity.id, entityCollection.id);
            }
        }
    }

    private emitManagerUpdated(): void {
        this.emit("onEntityCollectionManagerUpdated", this.serialize());
    }
}
