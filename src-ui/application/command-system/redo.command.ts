import { EditorFacade } from "@/application/editor.facade";
import { ISystemCommand } from "@/editor/interface/base-command.interface";
import { Result } from "@/shared/types/result";
import { SystemCommand } from "../commands/command.decorator";
import { SYSTEM_COMMAND_IDS } from "./command-ids";

@SystemCommand({
    id: SYSTEM_COMMAND_IDS.TilemapRedo,
    name: "Redo",
    description: "",
    shortcuts: ["Ctrl+Y"],
    when: "tilmapSessionOpened && !isModalOpen || undoableDialogOpen",
})
export class RedoCommand implements ISystemCommand {
    public execute(editorFacade: EditorFacade): Result {
        const session = editorFacade.getCurrentEditorSession();
        if (!session) return Result.Cancel();
        session.historyManager.redo(session);
        return Result.Success();
    }

    public canExecute(editorFacade: EditorFacade): boolean {
        const historyManager = editorFacade.getCurrentEditorSession()?.historyManager;
        if (!historyManager) return false;
        return historyManager.canRedo;
    }
}