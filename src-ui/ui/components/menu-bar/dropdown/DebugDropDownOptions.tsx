import i18n, { i18nService } from "@/app/providers/i18n";
import { appKernel } from "@/application/bootstrap/app-kernel";
import { useNavigationStore } from "@/ui/stores/navigation.store";

const DebugDropdownOptionGroup1: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.debug.action.home",
        onClick() {
            useNavigationStore.getState().navigate?.("/");
        },
	},
	{
		type: "option",
		label: "menu.debug.action.clearLocalStorage",
		onClick() {
			localStorage.clear();
		}
	},
	{
		type: "option",
		label: "menu.debug.action.toggleLanguage",
		onClick() {
			i18nService.changeLanguage(i18n.language === "en" ? "vi" : "en");
		}
	},
	{
		type: "option",
		label: "menu.debug.action.printProjects",
		onClick() {
			console.log(appKernel.projectManager.serialize());
		}
	},
];

export const DebugDropdownOptions: MenuItemType = {
    label: "menu.debug.label",
    className: "w-60",
    groups: [DebugDropdownOptionGroup1],
};