import i18n, { i18nService } from "@/app/providers/i18n";
import { appKernel } from "@/application/bootstrap/app-kernel";
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
];

export const DebugDropdownOptions: MenuItemType = {
    label: "Debug",
    className: "w-60",
    groups: [DebugDropdownOptionGroup1],
};