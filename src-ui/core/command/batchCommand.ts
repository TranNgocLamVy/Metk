import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";

import { EditorContext } from "../application/editorContext";
import { IBaseCommand } from "../interface/IBaseCommand";

export class BatchCommand implements IBaseCommand {
    public readonly id: string;
    private commands: IBaseCommand[];

    constructor(commands: IBaseCommand[]) {
        this.id = uuidv4();
        this.commands = commands;
    }

    public execute(context: EditorContext): Result {
        const results = this.commands.map(cmd => cmd.execute(context))
        const success = results.every(result => result.status === Result.Status.Success)
        const message = results.map(result => result.message).filter(msg => msg != undefined).join("\n")
        return success ? Result.Success() : Result.Error(message);
    }

    public undo(context: EditorContext): Result {
        const results = [...this.commands].reverse().map(cmd => cmd.undo(context));
        const success = results.every(result => result.status === Result.Status.Success)
        const message = results.map(result => result.message).filter(msg => msg != undefined).join("\n")
        return success ? Result.Success() : Result.Error(message);
    }

    public delete(): void {
        this.commands.forEach(cmd => cmd.delete());
    }
}