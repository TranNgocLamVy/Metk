import { SystemCommandManager } from "../manager/SystemCommandManager";

export type CommandData = {
    id: string;
    name: string;
    description?: string;
    shortcuts?: string;
    constructor: any;
}

export type CommandMetadata = Omit<CommandData, "constructor">

export function SystemCommand(metadata: CommandMetadata) {
    return function (constructor: any) {
        SystemCommandManager.COMMAND_REGISTRY.push({ ...metadata, constructor });
    };
}