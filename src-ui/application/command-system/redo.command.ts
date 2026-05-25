import { EditorFacade } from "@/application/editor.facade";
import { SystemCommand } from "../commands/command.decorator";
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
    public execute(editorFacade: EditorFacade): Result {
        const historyManager = editorFacade.getCurrentHistoryManager();
        if (!historyManager) return Result.Cancel();
        historyManager.redo(editorFacade);
        return Result.Success();
    }
}