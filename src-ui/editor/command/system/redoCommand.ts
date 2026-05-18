import { EditorContext } from "@/editor/application/editorContext";
import { SystemCommand } from "@/editor/decorator/command";
import { ISystemCommand } from "@/editor/interface/IBaseCommand";
import { Result } from "@/shared/types/result";

@SystemCommand({
    id: "workspace.tilemap.redo",
    name: "Redo",
    description: "",
    shortcuts: ["Ctrl+Y"],
    when: "tilmapSessionOpened && !isModalOpen",
})
export class RedoCommand implements ISystemCommand {
    public execute(context: EditorContext): Result {
        const historyManager = context.getCurrentHistoryManager();
        if (!historyManager) return Result.Cancel();
        historyManager.redo(context);
        return Result.Success();
    }
}