import { ToolManager } from "../manager/toolManager";

export type ToolContext = {
    id: string;
    name: string;
    description?: string;
    shortcuts?: string[];
    constructor: any;
    displayOnToolbar?: {
        icon: string;
        tooltip?: string;
        index?: number;
    }
}

export type ToolMetaData = Omit<ToolContext, "constructor">


export function Tool(metadata: ToolMetaData) {
    return function (constructor: any) {
        ToolManager.TOOL_REGISTRY.push({ ...metadata, constructor });
    };
}