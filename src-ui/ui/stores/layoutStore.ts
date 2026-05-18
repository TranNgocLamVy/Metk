import { appCore } from "@/editor/appcore";
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

appCore.layoutManager.on("onLayoutLoaded", (layout) => {
	useLayoutStore.getState().setModel(Model.fromJson(layout));
});

appCore.layoutManager.on("onLayoutUnloaded", () => {
	useLayoutStore.getState().setModel(null);
});