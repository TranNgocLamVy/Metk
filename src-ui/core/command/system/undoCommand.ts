import { EditorContext } from "@/core/application/editorContext";
import { SystemCommand } from "@/core/decorator/command";
import { ISystemCommand } from "@/core/interface/IBaseCommand";
import { Result } from "@/shared/types/result";

@SystemCommand({
    id: "project.undo",
    name: "Undo",
    description: "",
    shortcuts: ["Ctrl+Z"],
    when: "inWorkspace && !isModalOpen",
})
export class UndoCommand implements ISystemCommand {
    public execute(context: EditorContext): Result {
        const historyManager = context.getCurrentHistoryManager();
        if (!historyManager) return Result.Error("History manager not found");
        historyManager.undo(context);
        return Result.Success();
    }
}