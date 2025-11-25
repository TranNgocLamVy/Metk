import { DockviewApi } from "dockview";
import { create } from "zustand";

import { BasePanel } from "@/view/components/panel/basePanel";

type TilesetSelectorState = {
    api: DockviewApi | null;
    panels: BasePanel[];

    initDockViewApi: (api: DockviewApi) => void;
    openTilesetSelectorPanels: (tileset: BasePanel[]) => void;
}

export const useTilesetSelectorDockStore = create<TilesetSelectorState>((set, get) => {
    return {
        api: null,
        panels: [],

        initDockViewApi: (api) => {
            set({ api: api });
            const panels = get().panels;
            panels.forEach((panel) => {
                api.addPanel({ id: panel.id, title: panel.title, component: "default", params: { dock: panel } });
            });
        },
        openTilesetSelectorPanels: (tilesets: BasePanel[]) => {
            const api = get().api;
            if (!api) {
                console.log("api is null");
                set({ panels: tilesets });
                return;
            }
            const panels = get().panels;
            panels.forEach((panel) => {
                api.getPanel(panel.id)?.api.close();
            });
            for (let i = 0; i < tilesets.length; i++) {
                const panel = tilesets[i];
                api.addPanel({ id: panel.id, title: panel.title, component: "default", params: { dock: panel } });
            }
            set({ panels: tilesets });
        },
    };
});
