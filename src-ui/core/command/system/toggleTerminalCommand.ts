import { EditorContext } from "@/core/application/editorContext";
import { SystemCommand } from "@/core/decorator/command";
import { ISystemCommand } from "@/core/interface/IBaseCommand";
import { Result } from "@/shared/types/result";
import { useTerminalStore } from "@/view/stores/terminalStore";

@SystemCommand({
    id: "project.toggleTerminal",
    name: "Toggle Terminal",
    description: "",
    shortcuts: ["Ctrl+`"],
})
export class ToggleTerminalCommand implements ISystemCommand {
    public execute(context: EditorContext): Result {
        useTerminalStore.getState().toggleTerminal();
        return Result.Success();
    }
}