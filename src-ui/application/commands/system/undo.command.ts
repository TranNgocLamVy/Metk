import { EditorFacade } from "@/application/editor.facade";
import { SystemCommand } from "../command.decorator";
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
        const historyManager = editorFacade.getCurrentHistoryManager();
        if (!historyManager) return Result.Cancel();
        historyManager.undo(editorFacade);
        return Result.Success();
    }
}