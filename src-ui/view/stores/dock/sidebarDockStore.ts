import { DockviewApi } from "dockview";
import { create } from "zustand";

import { ExplorerPanel } from "@/view/components/panel/sidebar/explorerPanel";
import { TilelayerControllerPanel } from "@/view/components/panel/sidebar/tilelayerControllerPanel";

type DockStoreState = {
	api: DockviewApi | null;
	explorerPanel: ExplorerPanel | null;
    tilelayerControllerPanel: TilelayerControllerPanel | null;

	initDockViewApi: (api: DockviewApi) => void;
	openExplorerPanel: () => void;
	closeExplorerPanel: () => void;

    openTilesetSelectorPanel: () => void;
    closeTilesetSelectorPanel: () => void;

    openTilelayerControllerPanel: (panel: TilelayerControllerPanel) => void;
    closeTilelayerControllerPanel: () => void;
};

export const useSidebarDockStore = create<DockStoreState>((set, get) => {
	return {
		api: null,
		explorerPanel: null,
        tilelayerControllerPanel: null,

		initDockViewApi: (api) => {
			set({ api: api });
			get().openExplorerPanel();
            get().openTilesetSelectorPanel();
            
            const explorerPanel = get().explorerPanel;
            if (explorerPanel) {
                api.getPanel(explorerPanel.id)?.focus();
            }
		},
		openExplorerPanel: () => {
			const api = get().api;
			if (!api) return;
			const explorerPanel = new ExplorerPanel({});
			const explorer = api.addPanel({ id: explorerPanel.id, title: explorerPanel.title, component: "default", tabComponent: "default", params: { dock: explorerPanel }});
            explorer.focus();
			set({ explorerPanel: explorerPanel });
		},
		closeExplorerPanel: () => {
			const api = get().api;
			if (!api) return;
			const panel = get().explorerPanel;
			if (!panel) return;
			api.getPanel(panel.id)?.api.close();
			set({ explorerPanel: null });
		},

        openTilesetSelectorPanel: () => {
            const api = get().api;
            if (!api) return;
            api.addPanel({ id: "tilesetSelector", title: "Tileset", component: "tilesetSelector", tabComponent: "default" });
        },
        closeTilesetSelectorPanel: () => {
            const api = get().api;
            if (!api) return;
            const panel = get().explorerPanel;
            if (!panel) return;
            api.getPanel(panel.id)?.api.close();
            set({ explorerPanel: null });
        },

        openTilelayerControllerPanel: (panel: TilelayerControllerPanel) => {
            const api = get().api;
            if (!api) return;
            api.addPanel({ id: panel.id, title: "Layer", component: "default", tabComponent: "default", params: { dock: panel } });
        },
        closeTilelayerControllerPanel: () => {
            const api = get().api;
            if (!api) return;
            const panel = get().tilelayerControllerPanel;
            if (!panel) return;
            api.getPanel(panel.id)?.api.close();
            set({ explorerPanel: null });
        },
	};
});
