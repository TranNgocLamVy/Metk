import { EditorContext } from "@/editor/application/editorContext";
import { SystemCommand } from "@/editor/decorator/command";
import { ISystemCommand } from "@/editor/interface/IBaseCommand";
import { DialogZLevel } from "@/shared/types/dialog";
import { Result } from "@/shared/types/result";
import { useDialogStore } from "@/ui/stores/dialogStore";

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