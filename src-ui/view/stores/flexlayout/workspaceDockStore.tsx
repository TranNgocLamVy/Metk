import { ITabRenderValues, Model, TabNode } from "flexlayout-react";
import { Terminal } from "lucide-react";
import { create } from "zustand";

import Debug from "@/view/components/workspace/debug";
import Explorer from "@/view/components/workspace/explorer";
import LayerManager from "@/view/components/workspace/layerManager/layerManager";
import Log from "@/view/components/workspace/log";
import TilemapEditor from "@/view/components/workspace/tilemapEditor/tilemapEditor";
import TilesetView from "@/view/components/workspace/tilesetView/tilesetView";

import { workspaceLayout } from "./jsonModel/workspaceJsonModel";

type WorkspaceState = {
	model: Model;
	setModel: (model: Model) => void;
	factory: (node: TabNode) => JSX.Element | null;
	onRenderTab: (node: TabNode, renderValues: ITabRenderValues) => void;
};

const getModel = () => {
    const localStorageLayout = localStorage.getItem("workspaceLayout");
    if (localStorageLayout) {
        try {
            return Model.fromJson(JSON.parse(localStorageLayout));
        } catch (e) {
            console.error("Failed to parse workspace layout from localStorage", e);
        }
    }
	return Model.fromJson(workspaceLayout);
};

export const useWorkspaceDockStore = create<WorkspaceState>((set, get) => {
	return {
		model: getModel(),
		setModel: (model: Model) => {
			set({ model });
		},
		factory: (node: TabNode) => {
			const component = node.getComponent();
			switch (component) {
				case "tilesetView":
					return <TilesetView />;
				case "layerManager":
					return <LayerManager />;
                case "tilemapEditor":
                    return <TilemapEditor />
                case "explorer":
                    return <Explorer />
                case "debug":
                    return <Debug />
                case "log":
                    return <Log />;
				default:
					return <div className="w-full h-full flex items-center justify-center">{`Unknow "${node.getComponent()}" Component`}</div>;
			}
		},
		onRenderTab: (node: TabNode, renderValues: ITabRenderValues) => {
			switch (node.getIcon()) {
				case "Terminal":
					renderValues.leading = <Terminal />;
					break;
			}
		},
	};
});
