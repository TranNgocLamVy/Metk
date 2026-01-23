import { ToastService } from "@/shared/services/toastService";

import { EditorContext } from "../application/editorContext";
import { RedoCommand } from "../command/system/redoCommand";
import { SaveCommand } from "../command/system/saveCommand";
import { UndoCommand } from "../command/system/undoCommand";
import { CommandId, CommandIdTypes } from "../constance/systemCommand";
import { ISystemCommandConstructor } from "../interface/IBaseCommand";

export class SystemCommandManager {
    private commands: Map<string, ISystemCommandConstructor> = new Map(); 

    constructor(
        private readonly editorContext: EditorContext,
    ) {
        this.registerCommand(CommandId.ProjectSave, SaveCommand);
        this.registerCommand(CommandId.ProjectUndo, UndoCommand);
        this.registerCommand(CommandId.ProjectRedo, RedoCommand);
    }

    public registerCommand(id: CommandIdTypes, commandClass: ISystemCommandConstructor) {
        this.commands.set(id, commandClass);
    }

    public execute(commandId: string) {
        const CommandClass = this.commands.get(commandId);
        if (CommandClass) {
            const command = new CommandClass();
            const result = command.execute(this.editorContext);
            if (result.status !== "Success") {
                ToastService.error({ message: result.message });
            }
        } else {
            console.warn(`Command ID ${commandId} not found.`);
        }
    }
}