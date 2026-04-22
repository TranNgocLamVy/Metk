import { EditorContext } from "@/core/application/editorContext";
import { SystemCommand } from "@/core/decorator/command";
import { ISystemCommand } from "@/core/interface/IBaseCommand";
import { Result } from "@/shared/types/result";

@SystemCommand({
    id: "project.redo",
    name: "Redo",
    description: "",
    shortcuts: ["Ctrl+Y"],
    when: "inWorkspace",
})
export class RedoCommand implements ISystemCommand {
    public execute(context: EditorContext): Result {
        const historyManager = context.getCurrentHistoryManager();
        if (!historyManager) return Result.Error("History manager not found");
        historyManager.redo(context);
        return Result.Success();
    }
}