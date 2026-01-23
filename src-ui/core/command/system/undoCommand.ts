import { EditorContext } from "@/core/application/editorContext";
import { ISystemCommand } from "@/core/interface/IBaseCommand";
import { ErrorResult, Result, SuccessResult } from "@/shared/types/result";

export class UndoCommand implements ISystemCommand {
    execute(context: EditorContext): Result {
        const historyManager = context.getCurrentHistoryManager();
        if (!historyManager) return ErrorResult("History manager not found");
        historyManager.undo(context);
        return SuccessResult();
    }
}