import { appCore } from "@/core/appcore";
import { RuleLayer } from "@/core/application/tile/layer/ruleLayer";
import i18n, { i18nService } from "@/shared/services/i18n";
import { useNavigationStore } from "@/ui/stores/navigationStore";

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
			console.log(appCore.projectManager.serialize());
		}
	},
    {
        type: "option",
        label: "save project manager",
        async onClick() {
            await appCore.saveProjectManager();
        }
    },
    {
        type: "option",
        label: "print current project",
        async onClick() {
			console.log(appCore.projectManager.currentProject);
        }
    },
    {
        type: "option",
        label: "print current tilemap",
        async onClick() {
			console.log(appCore.workspaceManager.currentWorkspace?.tilemapSessionManager.activeSession?.tilemap);
        }
    },
    {
        type: "option",
        label: "recalculate rule layer",
        async onClick() {
			const tilemap = appCore.workspaceManager.currentWorkspace?.tilemapSessionManager.activeSession?.tilemap;
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