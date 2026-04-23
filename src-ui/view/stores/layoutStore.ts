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
		setModel: (model: Model) => { set({ model }) },
	};
});
