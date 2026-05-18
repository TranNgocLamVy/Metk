import { EditorFacade } from "@/application/editor.facade";
import { SystemCommand } from "../command.decorator";
import { ISystemCommand } from "@/editor/interface/base-command.interface";
import { Result } from "@/shared/types/result";

@SystemCommand({
    id: "workspace.tilemap.redo",
    name: "Redo",
    description: "",
    shortcuts: ["Ctrl+Y"],
    when: "tilmapSessionOpened && !isModalOpen",
})
export class RedoCommand implements ISystemCommand {
    public execute(context: EditorFacade): Result {
        const historyManager = context.getCurrentHistoryManager();
        if (!historyManager) return Result.Cancel();
        historyManager.redo(context);
        return Result.Success();
    }
}