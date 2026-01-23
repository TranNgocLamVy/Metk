import { v4 as uuidv4 } from "uuid";

import { EditorContext } from "../application/editorContext";
import { IBaseCommand } from "../interface/IBaseCommand";

export class BatchCommand implements IBaseCommand {
    public readonly id: string;
    private commands: IBaseCommand[];

    constructor(commands: IBaseCommand[]) {
        this.id = uuidv4();
        this.commands = commands;
    }

    public execute(context: EditorContext): void {
        this.commands.forEach(cmd => cmd.execute(context));
    }

    public undo(context: EditorContext): void {
        [...this.commands].reverse().forEach(cmd => cmd.undo(context));
    }

    public delete(): void {
        this.commands.forEach(cmd => cmd.delete());
    }
}