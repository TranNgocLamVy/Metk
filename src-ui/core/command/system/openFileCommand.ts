import { EditorContext } from "@/core/application/editorContext";
import { SystemCommand } from "@/core/decorator/command";
import { ISystemCommand } from "@/core/interface/IBaseCommand";
import { Result } from "@/shared/types/result";
import { useModalStore } from "@/view/stores/modalStore";

@SystemCommand({
    id: "project.openFile",
    name: "Open File",
    description: "",
    shortcuts: ["Ctrl+P", "Ctrl+O"],
})
export class RedoCommand implements ISystemCommand {
    public execute(context: EditorContext): Result {
        useModalStore.getState().openModal({ modalName: "OPEN_FILE" });
        return Result.Success();
    }
}