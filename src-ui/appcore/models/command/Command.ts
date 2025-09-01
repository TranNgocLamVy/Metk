export interface CommandConfig {
    undoAble?: boolean;
    redoAble?: boolean;
}

export interface CommandContext {
    // Do later
}

export interface ExecuteResult {
    status: ExecuteResultStatus;
    pushToStack?: boolean;
    message?: string;
}
export type ExecuteResultStatus = "success" | "error" | "cancelled";

export class BaseCommand {
    get commandName(): string {
        throw new Error("Method not implemented.");
    }
    get commandConfig(): CommandConfig {
        throw new Error("Method not implemented.");
    }
    constructor(public commandContext: CommandContext) {}
    execute(): ExecuteResult | Promise<ExecuteResult> {
        throw new Error("Method not implemented.");
    }
    undo(): ExecuteResult | Promise<ExecuteResult> {
        throw new Error("Method not implemented.");
    }
    redo(): ExecuteResult | Promise<ExecuteResult> {
        throw new Error("Method not implemented.");
    }
}