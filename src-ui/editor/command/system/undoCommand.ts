import { EditorContext } from "@/editor/application/editorContext";
import { SystemCommand } from "@/editor/decorator/command";
import { ISystemCommand } from "@/editor/interface/IBaseCommand";
import { Result } from "@/shared/types/result";

@SystemCommand({
    id: "workspace.tilemap.undo",
    name: "Undo",
    description: "",
    shortcuts: ["Ctrl+Z"],
    when: "tilmapSessionOpened && !isModalOpen",
})
export class UndoCommand implements ISystemCommand {
    public execute(context: EditorContext): Result {
        const historyManager = context.getCurrentHistoryManager();
        if (!historyManager) return Result.Cancel();
        historyManager.undo(context);
        return Result.Success();
    }
}