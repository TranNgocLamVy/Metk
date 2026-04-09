import { EditorContext } from "@/core/application/editorContext";
import { SystemCommand } from "@/core/decorator/command";
import { ISystemCommand } from "@/core/interface/IBaseCommand";
import { Result } from "@/shared/types/result";
import { useDialogStore } from "@/view/stores/dialogStore";

@SystemCommand({
    id: "project.openFile",
    name: "Open File",
    description: "",
    shortcuts: ["Ctrl+P", "Ctrl+O"],
})
export class OpenFileCommand implements ISystemCommand {
    public execute(context: EditorContext): Result {
        useDialogStore.getState().openDialog("OPEN_FILE_DIALOG");
        return Result.Success();
    }
}