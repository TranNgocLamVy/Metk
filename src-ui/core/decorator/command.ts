import { SystemCommandManager } from "../manager/systemCommandManager";

export type CommandContext = {
    id: string;
    name: string;
    description?: string;
    shortcuts?: string[];
    constructor: any;
}

export type CommandMetadata = Omit<CommandContext, "constructor">

export function SystemCommand(metadata: CommandMetadata) {
    return function (constructor: any) {
        SystemCommandManager.COMMAND_REGISTRY.push({ ...metadata, constructor });
    };
}