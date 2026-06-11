import { EditorFacade } from "@/application/editor.facade";
import { ISystemCommand } from "@/editor/interface/base-command.interface";
import { DialogZLevel } from "@/shared/types/dialog";
import { Result } from "@/shared/types/result";
import { useDialogStore } from "@/ui/stores/dialog.store";
import { SystemCommand } from "../commands/command.decorator";
import { SYSTEM_COMMAND_IDS } from "./command-ids";

@SystemCommand({
    id: SYSTEM_COMMAND_IDS.OpenFile,
    name: "menu.file.action.open.file",
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