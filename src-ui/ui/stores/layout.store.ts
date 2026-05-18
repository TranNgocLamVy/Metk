import { appKernel } from "@/application/bootstrap/app-kernel";
import { Model } from "flexlayout-react";
import { create } from "zustand";


type LayoutState = {
	model: Model | null;
	setModel: (model: Model | null) => void;
};

export const useLayoutStore = create<LayoutState>((set, get) => {
	return {
		model: null,
		setModel: (model) => { set({ model }) },
	};
});

appKernel.layoutManager.on("onLayoutLoaded", (layout) => {
	useLayoutStore.getState().setModel(Model.fromJson(layout));
});

appKernel.layoutManager.on("onLayoutUnloaded", () => {
	useLayoutStore.getState().setModel(null);
});