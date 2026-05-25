import { appKernel } from "@/application/bootstrap/app-kernel";
import { workspaceLayout } from "@/shared/constant/workspaceJsonModel";
import { Model } from "flexlayout-react";
import { create } from "zustand";


type LayoutState = {
	model: Model;
	setModel: (model: Model) => void;
};

export const useLayoutStore = create<LayoutState>((set, get) => {
	return {
		model: Model.fromJson(workspaceLayout),
		setModel: (model) => { set({ model }) },
	};
});

appKernel.layoutManager.on("onLayoutLoaded", (layout) => {
	useLayoutStore.getState().setModel(Model.fromJson(layout));
});

appKernel.layoutManager.on("onLayoutUnloaded", () => {
	useLayoutStore.getState().setModel(Model.fromJson(workspaceLayout));
});