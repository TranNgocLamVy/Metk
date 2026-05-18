import { ToolManager } from "./tool.manager";

export type ToolContext = {
    id: string;
    label: string;
    description?: string;
    shortcuts?: string[];
    constructor: any;
    when?: string;
    displayOnToolbar?: {
        icon: string;
        tooltip?: string;
        index?: number;
    }
}

export type ToolMetadata = Omit<ToolContext, "constructor">


export function Tool(metadata: ToolMetadata) {
    return function (constructor: any) {
        ToolManager.TOOL_REGISTRY.push({ ...metadata, constructor });
    };
}