import { EditorFacade } from "@/application/editor.facade";
import { HistoryManager } from "@/application/resources/history/history.manager";
import { IEditorSession } from "@/editor/interface/base-session.interface";
import { Tileset } from "@/editor/model/tileset/tileset";

export class EditTilesetSession implements IEditorSession {
    public readonly historyManager = new HistoryManager();

    constructor(
        public readonly id: string,
        public readonly tileset: Tileset,
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