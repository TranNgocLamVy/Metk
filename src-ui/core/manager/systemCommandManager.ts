import { ToastService } from "@/shared/services/toastService";

import { EditorContext } from "../application/editorContext";
import { CommandData } from "../decorator/command";
import { ISystemCommandConstructor } from "../interface/IBaseCommand";

export class SystemCommandManager {
    public static COMMAND_REGISTRY: Array<CommandData> = [];

    private commands: Map<string, ISystemCommandConstructor> = new Map(); 

    constructor(
        private readonly editorContext: EditorContext,
    ) {
        this.initializeDecoratedCommands();
    }

    private initializeDecoratedCommands() {
        SystemCommandManager.COMMAND_REGISTRY.forEach((commandData: CommandData) => {
            this.registerCommand(commandData.id, commandData.constructor);
        });
    }

    public registerCommand(id: string, commandClass: ISystemCommandConstructor) {
        this.commands.set(id, commandClass);
    }

    public async execute(commandId: string): Promise<void> {
        const CommandClass = this.commands.get(commandId);
        if (CommandClass) {
            const command = new CommandClass();
            const result = await command.execute(this.editorContext);
            if (result.status !== "Success") ToastService.error({ message: result.message });
        } else {
            ToastService.error({message: `Command ID ${commandId} not found.`});
        }
    }
}