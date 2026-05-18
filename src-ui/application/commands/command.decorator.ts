import { SystemCommandManager } from "./system-command.manager";

export type CommandContext = {
    id: string;
    name: string;
    description?: string;
    shortcuts?: string[];
    when?: string;
    constructor: any;
}

export type CommandMetadata = Omit<CommandContext, "constructor">

export function SystemCommand(metadata: CommandMetadata) {
    return function (constructor: any) {
        SystemCommandManager.COMMAND_REGISTRY.set(metadata.id, { ...metadata, constructor });
    };
}