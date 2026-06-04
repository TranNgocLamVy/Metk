import { appKernel } from "@/application/bootstrap/app-kernel";
import { RuleLayer } from "@/editor/model/tilemap/layer/rule-layer";
import i18n, { i18nService } from "@/app/providers/i18n";
import { useNavigationStore } from "@/ui/stores/navigation.store";

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
			console.log(appKernel.projectManager.serialize());
		}
	},
    {
        type: "option",
        label: "save project manager",
        async onClick() {
            await appKernel.saveProjectManager();
        }
    },
    {
        type: "option",
        label: "print current project",
        async onClick() {
			console.log(appKernel.projectManager.currentProject);
        }
    },
    {
        type: "option",
        label: "print current tilemap",
        async onClick() {
			console.log(appKernel.workspaceManager.currentWorkspace?.tilemapSessionManager.activeSession?.tilemap);
        }
    },
    {
        type: "option",
        label: "recalculate rule layer",
        async onClick() {
			const tilemap = appKernel.workspaceManager.currentWorkspace?.tilemapSessionManager.activeSession?.tilemap;
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