import { EditorContext } from "@/editor/application/editorContext";
import { SystemCommand } from "@/editor/decorator/command";
import { ISystemCommand } from "@/editor/interface/IBaseCommand";
import { Result } from "@/shared/types/result";
import { useConsoleStore } from "@/ui/stores/consoleStore";

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