import { EntityCollectionManager } from "@/application/resources/entity/entity-collection.manager";
import { EntityDefinition } from "@/editor/model/entity/entity-definition";
import { FilePathSystem } from "@/infrastructure/project-path-system";
import { EntityCollectionRefData } from "@/shared/data-types/entity-collection.data";
import { EntityRefData } from "@/shared/data-types/layer.data";

export class EntityCollectionRefManager {
    private entityCollectionRefs: EntityCollectionRefData[] = [];
    private nextIndex: number = 0;

    public constructor(
        public readonly entityCollectionManager: EntityCollectionManager,
        public readonly filePathSystem: FilePathSystem,
    ) { }

    public loadData(entityCollectionRefs: EntityCollectionRefData[], nextIndex: number): void {
        this.entityCollectionRefs = entityCollectionRefs || [];
        this.nextIndex = Number.isNaN(nextIndex) || nextIndex == null ? 0 : nextIndex;
    }

    public getRefIds(): string[] {
        return this.entityCollectionRefs.map((ref) => ref.id);
    }

    public addEntityCollectionToRefs(entityCollectionId: string): void {
        if (this.entityCollectionRefs.find((ref) => ref.id === entityCollectionId)) return;

        const metadata = this.entityCollectionManager.getEntityCollectionMetadataById(entityCollectionId);
        if (!metadata) return;

        this.entityCollectionRefs.push({
            index: this.nextIndex,
            id: metadata.id,
            name: metadata.name,
        });

        this.nextIndex += 1;
    }

    public getEntityCollectionRefIndex(entityCollectionId: string): number {
        const ref = this.entityCollectionRefs.find((item) => item.id === entityCollectionId);
        if (!ref) this.addEntityCollectionToRefs(entityCollectionId);

        return this.entityCollectionRefs.find((item) => item.id === entityCollectionId)?.index ?? -1;
    }

    public getEntityCollectionRefId(entityCollectionIndex: number): string | null {
        const ref = this.entityCollectionRefs.find((item) => item.index === entityCollectionIndex);
        return ref?.id ?? null;
    }

    public getEntityDefinitionByRef(entityRef: EntityRefData): EntityDefinition | null {
        const collection = this.entityCollectionManager.getEntityCollectionById(
            entityRef.entityCollectionId,
        );

        if (!collection) return null;

        return collection.getEntityDefinitionById(entityRef.entityDefinitionId);
    }

    public removeEntityCollectionRef(entityCollection: string | number): number {
        const entityCollectionRefIndex =
            typeof entityCollection === "string"
                ? this.entityCollectionRefs.find((ref) => ref.id === entityCollection)?.index
                : entityCollection;

        if (entityCollectionRefIndex === undefined || entityCollectionRefIndex === -1) return -1;

        this.entityCollectionRefs = this.entityCollectionRefs.filter(
            (ref) => ref.index !== entityCollectionRefIndex,
        );

        return entityCollectionRefIndex;
    }

    public serialize(): { refs: EntityCollectionRefData[]; nextIndex: number } {
        return {
            refs: Array.from(this.entityCollectionRefs),
            nextIndex: this.nextIndex,
        };
    }
}