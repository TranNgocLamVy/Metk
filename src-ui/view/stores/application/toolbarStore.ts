import { ReactNode } from "react";
import { create } from "zustand";

import { AppCore } from "@/core/appcore";

export type ToolbarItemDisplayData = {
    id: string;
    icon: string | ReactNode;
    tooltip?: string;
    index: number;
    shortcuts?: string[]
}

type ToolbarStore = {
    tools: ToolbarItemDisplayData[],
    activeTool: string | null,
    version: number;

    setTools: (tools: ToolbarItemDisplayData[]) => void
    setActiveTool: (tool: string) => void
    refresh: () => void
}

export const useToolbarStore = create<ToolbarStore>((set, get) => ({
    tools: [],
    activeTool: null,
    version: 0,

    setTools: (tools: ToolbarItemDisplayData[]) => set({ tools: tools }),
    setActiveTool: (tool: string) => set({ activeTool: tool }),
    refresh: () => set((state) => ({ version: state.version + 1, tools: AppCore.getIns().toolManager.getToolsData(), activeTool: AppCore.getIns().toolManager.getCurrentToolId() })) 
}))