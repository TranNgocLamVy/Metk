
import { CommandRegistry } from "@/appcore/registries/command-registry";

import { EventBus } from "../core/EventBus";
import { BaseCommand, CommandContext } from "./Command";

export class CommandManager {
    private currentCommand: BaseCommand;
    private commandStack: any[] = [];
    private undoStack: any[] = [];


    constructor(eventBus: EventBus) {
        
    }

    public execute(commandName: string) {
        const command = CommandRegistry.getInstance().getCommand(commandName);
        if (command) {
            const context: CommandContext = { }
            this.currentCommand = new command(context);
            this.currentCommand.execute();
            if (this.currentCommand.commandConfig.undoAble) {
                this.commandStack.push(this.currentCommand);
            }
        }
    }

    public undo() {
        const command = this.commandStack.pop();
        if (command) {
            this.currentCommand = command;
            this.currentCommand.undo();
            if (this.currentCommand.commandConfig.redoAble) {
                this.undoStack.push(this.currentCommand);
            }
        }
    }
}