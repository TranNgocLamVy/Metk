import { create } from "zustand";

import { ToolManager } from "@/core/manager/toolManager";

export type ToolbarItemDisplayData = {
    id: string;
    icon: string;
    tooltip?: string;
    index: number;
    shortcuts?: string[]
}

type ToolbarStore = {
    toolManager: ToolManager;
    version: number;

    setToolManager: (toolManager: ToolManager) => void;
    getTools: () => ToolbarItemDisplayData[];
    getActiceTool: () => string | null
    refresh: () => void
}

export const useToolbarStore = create<ToolbarStore>((set, get) => ({
    toolManager: null!,
    version: 0,

    setToolManager: (toolManager: ToolManager) => set({ toolManager: toolManager }),
    getTools: () => {
        const toolManager = get().toolManager;
        if (!toolManager) return [];
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
        const toolManager = get().toolManager;
        if (!toolManager) return null;
        return toolManager.getCurrentToolId();
    },
    refresh: () => set((state) => ({ version: (state.version + 1) % 100000 })) 
}))