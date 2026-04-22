import { create } from "zustand";

import { appCore } from "@/core/appcore";

export type ToolbarItemDisplayData = {
    id: string;
    icon: string;
    tooltip?: string;
    index: number;
    shortcuts?: string[]
}

type ToolbarStore = {
    version: number;

    getTools: () => ToolbarItemDisplayData[];
    getActiceTool: () => string | null
    refresh: () => void
}

export const useToolbarStore = create<ToolbarStore>((set, get) => ({
    version: 0,

    getTools: () => {
        const toolManager = appCore.toolManager;
        const toolData: ToolbarItemDisplayData[] = [];
        toolManager.getToolContexts().forEach((toolContext) => {
            if (toolContext.displayOnToolbar) {
                toolData.push({
                    id: toolContext.id,
                    icon: toolContext.displayOnToolbar.icon,
                    tooltip: toolContext.displayOnToolbar.tooltip,
                    shortcuts: toolContext.shortcuts,
                    index: toolContext.displayOnToolbar.index ?? 1000
                });
            }
        })
        return toolData.sort((a, b) => a.index - b.index);
    },
    getActiceTool: () => {
        const toolManager = appCore.toolManager;
        return toolManager.getCurrentToolId();
    },
    refresh: () => set((state) => ({ version: (state.version + 1) % 100000 })) 
}))