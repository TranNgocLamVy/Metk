import { Result } from "@/shared/types/result";
import { CommandContext } from "../decorator/command";
import { ISystemCommandConstructor } from "../interface/IBaseCommand";
import { ContextManager } from "./contextManager";
import { EditorContext } from "../application/editorContext";
import { Console } from "@/shared/services/consoleService";

export class SystemCommandManager {
    public static COMMAND_REGISTRY: Map<string, CommandContext> = new Map();
    private commands: Map<string, ISystemCommandConstructor> = new Map();

    constructor(
        private readonly contextManager: ContextManager,
        private readonly editorContext: EditorContext
    ) {
        this.initializeDecoratedCommands();
    }

    private initializeDecoratedCommands() {
        SystemCommandManager.COMMAND_REGISTRY.forEach((commandData: CommandContext) => {
            this.registerCommand(commandData.id, commandData.constructor);
        });
    }

    public registerCommand(id: string, commandClass: ISystemCommandConstructor) {
        this.commands.set(id, commandClass);
    }

    public async execute(commandId: string) {
        const commandData = SystemCommandManager.COMMAND_REGISTRY.get(commandId);
        const commandConstructor = this.commands.get(commandId);

        if (!commandData || !commandConstructor) {
            return;
        }

        if (!this.contextManager.evaluateWhen(commandData.when)) {
            return;
        }

        const command = new commandConstructor();
        const result = await command.execute(this.editorContext);
        if (result.status === Result.Status.Error) {
            Console.error({ message: result.message });
        }
    }
}