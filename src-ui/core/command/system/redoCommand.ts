import { EditorContext } from "@/core/application/editorContext";
import { SystemCommand } from "@/core/decorator/command";
import { ISystemCommand } from "@/core/interface/IBaseCommand";
import { ErrorResult, Result, SuccessResult } from "@/shared/types/result";

@SystemCommand({
    id: "project.redo",
    name: "Redo",
    description: "",
    shortcuts: ["Ctrl+Y"],
})
export class RedoCommand implements ISystemCommand {
    public execute(context: EditorContext): Result {
        const historyManager = context.getCurrentHistoryManager();
        if (!historyManager) return Result.Error("History manager not found");
        historyManager.redo(context);
        return Result.Success();
    }
}