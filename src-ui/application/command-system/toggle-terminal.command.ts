import { EditorFacade } from "@/application/editor.facade";
import { ISystemCommand } from "@/editor/interface/base-command.interface";
import { Result } from "@/shared/types/result";
import { useConsoleStore } from "@/ui/stores/console.store";
import { SystemCommand } from "../commands/command.decorator";
import { SYSTEM_COMMAND_IDS } from "./command-ids";

@SystemCommand({
    id: SYSTEM_COMMAND_IDS.ToggleConsole,
    name: "command.toggleConsole.name",
    description: "",
    shortcuts: ["Ctrl+`"],
    when: "!isModalOpen",
})
export class ToggleConsoleCommand implements ISystemCommand {
    public execute(editorFacade: EditorFacade): Result {
        useConsoleStore.getState().toggleConsole();
        return Result.Success();
    }
}