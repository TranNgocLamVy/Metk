import { EditorContext } from "@/core/application/editorContext";
import { ISystemCommand } from "@/core/interface/IBaseCommand";
import { ErrorResult, Result, SuccessResult } from "@/shared/types/result";

export class RedoCommand implements ISystemCommand {
    public execute(context: EditorContext): Result {
        const historyManager = context.getCurrentHistoryManager();
        if (!historyManager) return ErrorResult("History manager not found");
        historyManager.redo(context);
        return SuccessResult();
    }
}