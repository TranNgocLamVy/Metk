import { workspaceLayout } from "@/shared/constant/workspaceJsonModel";
import { Model } from "flexlayout-react";
import { create } from "zustand";


type WorkspaceState = {
	model: Model;
	setModel: (model: Model) => void;
};

const getModel = () => {
    const localStorageLayout = localStorage.getItem("workspaceLayout");
    if (localStorageLayout) {
        try {
            const localModel = JSON.parse(localStorageLayout)
            const newModel = {...workspaceLayout}
            newModel.layout = localModel.layout
            return Model.fromJson(workspaceLayout);
        } catch (e) {
            console.error("Failed to parse workspace layout from localStorage", e);
        }
    }
	return Model.fromJson(workspaceLayout);
};

export const useWorkspaceDockStore = create<WorkspaceState>((set, get) => {
	return {
		model: getModel(),
		setModel: (model: Model) => { set({ model }) },
	};
});
