import { EditorContext } from "@/core/application/editorContext";
import { SystemCommand } from "@/core/decorator/command";
import { ISystemCommand } from "@/core/interface/IBaseCommand";
import { DialogZLevel } from "@/shared/types/dialog";
import { Result } from "@/shared/types/result";
import { useDialogStore } from "@/view/stores/dialogStore";

@SystemCommand({
    id: "workspace.openFile",
    name: "Open File",
    description: "",
    shortcuts: ["Ctrl+P", "Ctrl+O"],
    when: "projectOpened && !isModalOpen",
})
export class OpenFileCommand implements ISystemCommand {
    public execute(context: EditorContext): Result {
        useDialogStore.getState().openDialog("OPEN_FILE_DIALOG", { zLevel: DialogZLevel.Modal });
        return Result.Success();
    }
}