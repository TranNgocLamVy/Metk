import { EditorFacade } from "@/application/editor.facade";
import { EntityCollectionSessionManagerData } from "@/shared/data-types/entity-collection-session.data";

export class EntityCollectionSessionManager {
    private selectedEntityCollectionId: string | null = null;
    private selectedEntityId: string | null = null;

    constructor(
        entityCollectionSessionData: EntityCollectionSessionManagerData,
        private readonly editorFacade: EditorFacade
    ) {
        this.selectedEntityCollectionId = entityCollectionSessionData.selectedEntityCollectionId;
        this.selectedEntityId = entityCollectionSessionData.selectedEntityId;
    }

    public getSelectedEntityCollectionId(): string | null {
        return this.selectedEntityCollectionId;
    }

    public setSelectedEntityCollectionId(entityCollectionId: string | null): void {
        this.selectedEntityCollectionId = entityCollectionId;
    }

    public getSelectedEntityId(): string | null {
        return this.selectedEntityId;
    }

    public setSelectedEntityId(entityId: string | null): void {
        this.selectedEntityId = entityId;
    }

    public resetSelectedEntityId(): void {
        this.selectedEntityId = null;
    }

    public serialize(): EntityCollectionSessionManagerData {
        return {
            selectedEntityCollectionId: this.selectedEntityCollectionId,
            selectedEntityId: this.selectedEntityId,
        };
    }
}
