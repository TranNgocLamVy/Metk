import { EditorFacade } from "@/application/editor.facade";
import { HistoryManager } from "@/application/resources/history/history.manager";
import { IEditorSession } from "@/editor/interface/base-session.interface";
import { EntityDefinition } from "@/editor/model/entity/entity-definition";

export class EditEntityDefinitionSession implements IEditorSession {
    public readonly historyManager = new HistoryManager();

    constructor(
        public readonly id: string,
        public readonly entityCollection: EntityDefinition,
        private readonly editorFacade: EditorFacade,
        private readonly triggerUpdate: () => void,
    ) {}

    public get objectRegistry() {
        const registry = this.editorFacade.objectRegistry;
        if (!registry) {
            throw new Error("Object registry is unavailable.");
        }
        return registry;
    }

    public notifyChanged(): void {
        this.triggerUpdate();
    }

    public destroy(): void {}
}