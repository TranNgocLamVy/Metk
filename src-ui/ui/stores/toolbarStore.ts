import { create } from "zustand";

import { appCore } from "@/editor/appcore";

export type ToolbarItemDisplayData = {
    id: string;
    icon: string;
    tooltip?: string;
    index: number;
    shortcuts?: string[]
}

type ToolbarStore = {
    tools: ToolbarItemDisplayData[];
    activeTool: string | null;

    setTools: (tools: ToolbarItemDisplayData[]) => void;
    setActiveTool: (activeTool: string | null) => void;
}

export const useToolbarStore = create<ToolbarStore>((set, get) => ({
    tools: [],
    activeTool: null,

    setActiveTool: (activeTool: string | null) => set({ activeTool }),
    setTools: (tools: ToolbarItemDisplayData[]) => set({ tools }),
}))

appCore.toolManager.on("onToolChanged", (toolId) => {
    useToolbarStore.getState().setActiveTool(toolId);
})
