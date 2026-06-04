import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";

import { IUndoableCommand, IUndoableCommandContext } from "@/editor/interface/base-command.interface";

export class BatchCommand implements IUndoableCommand {
    public readonly id: string;
    private commands: IUndoableCommand[];

    constructor(commands: IUndoableCommand[]) {
        this.id = uuidv4();
        this.commands = commands;
    }

    public execute(context: IUndoableCommandContext): Result {
        const results = this.commands.map(cmd => cmd.execute(context))
        const success = results.every(result => result.status === Result.Status.Success)
        const message = results.map(result => result.message).filter(msg => msg != undefined).join("\n")
        return success ? Result.Success() : Result.Error(message);
    }

    public undo(context: IUndoableCommandContext): Result {
        const results = [...this.commands].reverse().map(cmd => cmd.undo(context));
        const success = results.every(result => result.status === Result.Status.Success)
        const message = results.map(result => result.message).filter(msg => msg != undefined).join("\n")
        return success ? Result.Success() : Result.Error(message);
    }

    public redo(context: IUndoableCommandContext): Result {
        const results = this.commands.map(cmd => cmd.redo ? cmd.redo(context) : cmd.execute(context))
        const success = results.every(result => result.status === Result.Status.Success)
        const message = results.map(result => result.message).filter(msg => msg != undefined).join("\n")
        return success ? Result.Success() : Result.Error(message);
    }

    public delete(): void {
        this.commands.forEach(cmd => cmd.delete());
    }
}
