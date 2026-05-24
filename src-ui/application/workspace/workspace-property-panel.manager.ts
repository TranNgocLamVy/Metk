import { EditorFacade } from "@/application/editor.facade";
import { BaseObject } from "@/editor/model/base-object";

export type PropertyPanelStateData = {
    selectedObjectId: string | null;
}

export class WorkspacePropertyPanelManager {
    private selectedObjectId: string | null;

    constructor(
        propertyPanelState: PropertyPanelStateData,
        private readonly editorFacade: EditorFacade,
    ) {
        this.selectedObjectId = propertyPanelState.selectedObjectId ?? null;
    }

    public getSelectedObjectId(): string | null {
        return this.selectedObjectId;
    }

    public getSelectedObject<T extends BaseObject = BaseObject>(): T | null {
        if (!this.selectedObjectId) return null;

        return this.editorFacade.objectRegistry?.get<T>(this.selectedObjectId) ?? null;
    }

    public selectObject(objectId: string | null): void {
        if (!objectId) {
            this.selectedObjectId = null;
            return;
        }

        const object = this.editorFacade.objectRegistry?.get(objectId);

        if (!object) {
            this.selectedObjectId = null;
            return;
        }

        this.selectedObjectId = objectId;
    }

    public clearSelection(): void {
        this.selectedObjectId = null;
    }

    public reconcile(): void {
        if (!this.selectedObjectId) return;

        const object = this.editorFacade.objectRegistry?.get(this.selectedObjectId);

        if (!object) {
            this.selectedObjectId = null;
        }
    }

    public serialize(): PropertyPanelStateData {
        return {
            selectedObjectId: this.selectedObjectId,
        };
    }
}