import { EditorFacade } from "@/application/editor.facade";
import { SystemCommand } from "../command.decorator";
import { ISystemCommand } from "@/editor/interface/base-command.interface";
import { Result } from "@/shared/types/result";
import { useConsoleStore } from "@/ui/stores/console.store";

@SystemCommand({
    id: "workspace.toggleConsole",
    name: "Toggle Console",
    description: "",
    shortcuts: ["Ctrl+`"],
    when: "!isModalOpen",
})
export class ToggleConsoleCommand implements ISystemCommand {
    public execute(context: EditorFacade): Result {
        useConsoleStore.getState().toggleConsole();
        return Result.Success();
    }
}