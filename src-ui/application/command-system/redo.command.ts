import { EditorFacade } from "@/application/editor.facade";
import { ISystemCommand } from "@/editor/interface/base-command.interface";
import { Result } from "@/shared/types/result";
import { SystemCommand } from "../commands/command.decorator";

@SystemCommand({
    id: "workspace.tilemap.redo",
    name: "Redo",
    description: "",
    shortcuts: ["Ctrl+Y"],
    when: "tilmapSessionOpened && !isModalOpen || undoableDialogOpen",
})
export class RedoCommand implements ISystemCommand {
    public execute(editorFacade: EditorFacade): Result {
        const session = editorFacade.getCurrentEditorSession();
        if (!session) return Result.Cancel();
        session.historyManager.redo(session);
        return Result.Success();
    }
}