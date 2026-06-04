import { EditorFacade } from "@/application/editor.facade";
import { SystemCommand } from "../commands/command.decorator";
import { ISystemCommand } from "@/editor/interface/base-command.interface";
import { Result } from "@/shared/types/result";

@SystemCommand({
    id: "workspace.tilemap.undo",
    name: "Undo",
    description: "",
    shortcuts: ["Ctrl+Z"],
    when: "tilmapSessionOpened && !isModalOpen",
})
export class UndoCommand implements ISystemCommand {
    public execute(editorFacade: EditorFacade): Result {
        const session = editorFacade.getCurrentEditorSession();
        if (!session) return Result.Cancel();
        session.historyManager.undo(session);
        return Result.Success();
    }
}
