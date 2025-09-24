import { DockviewApi } from "dockview";
import { create } from "zustand";

import { DefaultTileset } from "@/appcore/default/tile/defaultTileset";
import { ExplorerPanel } from "@/components/panel/sidebar/explorerPanel";
import { TilesetSelectPanel } from "@/components/panel/sidebar/tilemapSelectPanel";
import { DefaultSidebarTabHeader } from "@/components/tab/sidebarTabHeader";

export const explorerTabComponents = {
	default: DefaultSidebarTabHeader,
};

type DockStoreState = {
	api: DockviewApi | null;
	explorerPanel: ExplorerPanel | null;

	initDockViewApi: (api: DockviewApi) => void;
	openExplorerPanel: () => void;
	closeExplorerPanel: () => void;

    openTilesetSelectPanel: (tileset: DefaultTileset) => void;
};

export const useSidebarDockStore = create<DockStoreState>((set, get) => {
	return {
		api: null,
		explorerPanel: null,

		initDockViewApi: (api) => {
			set({ api: api });
			get().openExplorerPanel();
		},
		openExplorerPanel: () => {
			const api = get().api;
			if (!api) return;
			const explorerPanel = new ExplorerPanel({});
			api.addPanel({ id: explorerPanel.id, title: explorerPanel.title, component: "default", tabComponent: "default", params: { dock: explorerPanel } });
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
        openTilesetSelectPanel: (tileset: DefaultTileset) => {
            const api = get().api;
            if (!api) return;
            const panel = new TilesetSelectPanel({ tileset: tileset });
            api.addPanel({ id: panel.id, title: panel.title, component: "default", tabComponent: "default", params: { dock: panel } });
        },
	};
});
