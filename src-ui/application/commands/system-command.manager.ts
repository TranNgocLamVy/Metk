import { CommandContext } from "@/application/commands/command.decorator";
import { ISystemCommandConstructor } from "@/editor/interface/base-command.interface";
import { Result } from "@/shared/types/result";
import { Console } from "@/ui/notifications/console-gateway";
import { EditorFacade } from "../editor.facade";
import { ActivationContext } from "../runtime/activation-context";

export class SystemCommandManager {
    public static COMMAND_REGISTRY: Map<string, CommandContext> = new Map();
    private commands: Map<string, ISystemCommandConstructor> = new Map();

    constructor(
        private readonly contextManager: ActivationContext,
        private readonly editorFacade: EditorFacade
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

    public canExecute(commandId: string): boolean {
        const commandData = SystemCommandManager.COMMAND_REGISTRY.get(commandId);
        const commandConstructor = this.commands.get(commandId);

        if (!commandData || !commandConstructor) {
            return false;
        }

        return this.contextManager.evaluateWhen(commandData.when);
    }

    public async execute(commandId: string) {
        if (!this.canExecute(commandId)) {
            return;
        }

        const commandConstructor = this.commands.get(commandId);
        if (!commandConstructor) return;

        const command = new commandConstructor();
        const result = await command.execute(this.editorFacade);

        if (result.status === Result.Status.Error) {
            Console.error({ message: result.message });
        }
    }
}