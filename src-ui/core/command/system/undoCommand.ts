import { EditorContext } from "@/core/application/editorContext";
import { SystemCommand } from "@/core/decorator/command";
import { ISystemCommand } from "@/core/interface/IBaseCommand";
import { ErrorResult, Result, SuccessResult } from "@/shared/types/result";

@SystemCommand({
    id: "project.undo",
    name: "Undo",
    description: "",
    shortcuts: ["Ctrl+Z"],
})
export class UndoCommand implements ISystemCommand {
    public execute(context: EditorContext): Result {
        const historyManager = context.getCurrentHistoryManager();
        if (!historyManager) return ErrorResult("History manager not found");
        historyManager.undo(context);
        return SuccessResult();
    }
}