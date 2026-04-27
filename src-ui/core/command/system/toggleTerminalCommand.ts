import { EditorContext } from "@/core/application/editorContext";
import { SystemCommand } from "@/core/decorator/command";
import { ISystemCommand } from "@/core/interface/IBaseCommand";
import { Result } from "@/shared/types/result";
import { useConsoleStore } from "@/view/stores/consoleStore";

@SystemCommand({
    id: "workspace.toggleConsole",
    name: "Toggle Console",
    description: "",
    shortcuts: ["Ctrl+`"],
    when: "!isModalOpen",
})
export class ToggleConsoleCommand implements ISystemCommand {
    public execute(context: EditorContext): Result {
        useConsoleStore.getState().toggleConsole();
        return Result.Success();
    }
}