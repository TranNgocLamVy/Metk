import { AppCore } from "@/core/appcore";
import { RuleLayer } from "@/core/application/tile/layer/ruleLayer";
import i18n, { i18nService } from "@/core/service/i18n";
import { ToastService } from "@/shared/services/toastService";
import { useNavigationStore } from "@/view/stores/navigationStore";

const DebugDropdownOptionGroup1: MenuDropDownGroupType = [
	{
		type: "option",
		label: "Home",
        onClick() {
            useNavigationStore.getState().navigate?.("/");
        },
	},
	{
		type: "option",
		label: "Clear Local Storage",
		onClick() {
			localStorage.clear();
		}
	},
	{
		type: "option",
		label: "Toggle Language",
		onClick() {
			i18nService.changeLanguage(i18n.language === "en" ? "vi" : "en");
		}
	},
	{
		type: "option",
		label: "Print Projects",
		onClick() {
			console.log(AppCore.getIns().projectManager.serialize());
		}
	},
    {
        type: "option",
        label: "save project manager",
        async onClick() {
            await AppCore.getIns().saveProjectManager();
            ToastService.success({ message: "Project manager saved successfully" });
        }
    },
    {
        type: "option",
        label: "print current project",
        async onClick() {
			console.log(AppCore.getIns().projectManager.currentProject);
        }
    },
    {
        type: "option",
        label: "print current tilemap",
        async onClick() {
			console.log(AppCore.getIns().workspaceManager.currentWorkspace?.tilemapSessionManager.currentTilemapSession?.tilemap);
        }
    },
    {
        type: "option",
        label: "recalculate rule layer",
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
    label: "Debug",
    className: "w-60",
    groups: [DebugDropdownOptionGroup1],
};