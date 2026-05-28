import { v4 as uuidv4 } from "uuid";

import { Result } from "@/shared/types/result";

import { IUndoableCommand } from "@/editor/interface/base-command.interface";
import { EditorFacade } from "../editor.facade";

export class BatchCommand implements IUndoableCommand {
    public readonly id: string;
    private commands: IUndoableCommand[];

    constructor(commands: IUndoableCommand[]) {
        this.id = uuidv4();
        this.commands = commands;
    }

    public execute(editorFacade: EditorFacade): Result {
        const results = this.commands.map(cmd => cmd.execute(editorFacade))
        const success = results.every(result => result.status === Result.Status.Success)
        const message = results.map(result => result.message).filter(msg => msg != undefined).join("\n")
        return success ? Result.Success() : Result.Error(message);
    }

    public undo(editorFacade: EditorFacade): Result {
        const results = [...this.commands].reverse().map(cmd => cmd.undo(editorFacade));
        const success = results.every(result => result.status === Result.Status.Success)
        const message = results.map(result => result.message).filter(msg => msg != undefined).join("\n")
        return success ? Result.Success() : Result.Error(message);
    }

    public redo(editorFacade: EditorFacade): Result {
        const results = this.commands.map(cmd => cmd.redo ? cmd.redo(editorFacade) : cmd.execute(editorFacade))
        const success = results.every(result => result.status === Result.Status.Success)
        const message = results.map(result => result.message).filter(msg => msg != undefined).join("\n")
        return success ? Result.Success() : Result.Error(message);
    }

    public delete(): void {
        this.commands.forEach(cmd => cmd.delete());
    }
}
