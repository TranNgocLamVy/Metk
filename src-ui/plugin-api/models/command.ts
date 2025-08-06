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

export abstract class BaseCommand {
    abstract get commandName(): string;
    abstract get commandConfig(): CommandConfig;
    constructor(public commandContext: CommandContext) {}
    abstract execute(): ExecuteResult | Promise<ExecuteResult>;
    abstract undo(): ExecuteResult | Promise<ExecuteResult>;
    abstract redo(): ExecuteResult | Promise<ExecuteResult>;
}