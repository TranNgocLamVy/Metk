import { appKernel } from "@/application/bootstrap/app-kernel";
import { workspaceLayout } from "@/shared/constant/workspaceJsonModel";
import { Model } from "flexlayout-react";
import { create } from "zustand";


type LayoutState = {
	model: Model;
};

type LayoutActions = {
	setModel: (model: Model) => void;
};

type LayoutStore = LayoutState & {
	actions: LayoutActions;
};

const useLayoutStore = create<LayoutStore>((set) => {
	return {
		model: Model.fromJson(workspaceLayout),
		actions: {
			setModel: (model) => { set({ model }) },
		},
	};
});

appKernel.layoutManager.on("onLayoutLoaded", (layout) => {
	useLayoutStore.getState().actions.setModel(Model.fromJson(layout));
});

appKernel.layoutManager.on("onLayoutUnloaded", () => {
	useLayoutStore.getState().actions.setModel(Model.fromJson(workspaceLayout));
});

export const useLayoutModel = () => useLayoutStore((state) => state.model);
export const useLayoutActions = () => useLayoutStore((state) => state.actions);

export const getLayoutStoreState = () => useLayoutStore.getState();
export const resetLayoutStoreForTest = () => useLayoutStore.setState(useLayoutStore.getInitialState(), true);
export const setLayoutStoreStateForTest = (state: Partial<LayoutState>) => useLayoutStore.setState(state);
