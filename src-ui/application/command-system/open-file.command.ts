import { EditorFacade } from "@/application/editor.facade";
import { SystemCommand } from "../commands/command.decorator";
import { ISystemCommand } from "@/editor/interface/base-command.interface";
import { DialogZLevel } from "@/shared/types/dialog";
import { Result } from "@/shared/types/result";
import { useDialogStore } from "@/ui/stores/dialog.store";

@SystemCommand({
    id: "workspace.openFile",
    name: "Open File",
    description: "",
    shortcuts: ["Ctrl+P", "Ctrl+O"],
    when: "projectOpened && !isModalOpen",
})
export class OpenFileCommand implements ISystemCommand {
    public execute(editorFacade: EditorFacade): Result {
        useDialogStore.getState().openDialog("OPEN_FILE_DIALOG", { zLevel: DialogZLevel.Modal });
        return Result.Success();
    }
}