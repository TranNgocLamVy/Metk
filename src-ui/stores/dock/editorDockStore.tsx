import { DockviewApi } from "dockview";
import { create } from "zustand";

import SidebarDock from "@/components/dock/sidebarDock";
import TilemapDock from "@/components/dock/tilemapDock";
import { BasePanel, PanelWrapper } from "@/components/panel/basePanel";

export const editorComponents = {
    default: PanelWrapper,
    tilemap: TilemapDock,
    sidebar: SidebarDock,
} as const;

type DockStoreState = {
    api: DockviewApi | null;
    panels: BasePanel[];
    initDockViewApi: (api: DockviewApi) => void;
};

export const useEditorDockStore = create<DockStoreState>((set, get) => {
    return {
        api: null,
        panels: [],
        initDockViewApi: (api) => {
            set({ api: api });
            const sidebar = api.addPanel({ id: "sidebar", title: "Sidebar", component: "sidebar" });
            const tilemap = api.addPanel({ id: "tilemap", title: "Tilemap", component: "tilemap", position: {
                referenceGroup: sidebar.group,
                direction: "right",
            }});

            sidebar.group.api.setSize({width: 400})
            api.groups.forEach(group => {
                group.header.hidden = true;
            });
        }
    } 
})

