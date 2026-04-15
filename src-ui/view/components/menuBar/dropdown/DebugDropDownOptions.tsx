import { AppCore } from "@/core/appcore";
import { RuleLayer } from "@/core/application/tile/layer/ruleLayer";
import { ToastService } from "@/shared/services/toastService";
import { useNavigationStore } from "@/view/stores/navigationStore";

const DebugDropdownOptionGroup1: MenuDropDownGroupType = [
	{
		type: "option",
		name: "Home",
        onClick() {
            useNavigationStore.getState().navigate?.("/");
        },
	},
	{
		type: "option",
		name: "Clear Local Storage",
		onClick() {
			localStorage.clear();
		}
	},
	{
		type: "option",
		name: "Print Projects",
		onClick() {
			console.log(AppCore.getIns().projectManager.serialize());
		}
	},
    {
        type: "option",
        name: "save project manager",
        async onClick() {
            await AppCore.getIns().saveProjectManager();
            ToastService.success({ message: "Project manager saved successfully" });
        }
    },
    {
        type: "option",
        name: "print current project",
        async onClick() {
			console.log(AppCore.getIns().projectManager.currentProject);
        }
    },
    {
        type: "option",
        name: "print current tilemap",
        async onClick() {
			console.log(AppCore.getIns().workspaceManager.currentWorkspace?.tilemapSessionManager.currentTilemapSession?.tilemap);
        }
    },
    {
        type: "option",
        name: "recalculate rule layer",
        async onClick() {
			const tilemap = AppCore.getIns().workspaceManager.currentWorkspace?.tilemapSessionManager.currentTilemapSession?.tilemap;
            tilemap?.rootLayer.getAllLayers().forEach((layer) => {
                if (layer instanceof RuleLayer) {
                    layer.reCalculateAllOutputs();
                }
            })
        }
    },
];

export const DebugDropdownOptions: MenuItemType = {
    name: "Debug",
    className: "w-60",
    groups: [DebugDropdownOptionGroup1],
};