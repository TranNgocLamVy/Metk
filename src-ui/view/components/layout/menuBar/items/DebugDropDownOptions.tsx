import { AppCore } from "@/core/appcore";
import { i18nService } from "@/core/service/i18n";
import { useNavigationStore } from "@/view/stores/menu/navigationStore";

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
			console.log(AppCore.getIns().projectManager.projectMetaData);
		}
	},
    {
        type: "option",
        name: "Switch to English",
        onClick() {
            i18nService.changeLanguage("en");
        }
    },
    {
        type: "option",
        name: "Switch to VietNamese",
        onClick() {
            i18nService.changeLanguage("vi");
        }
    },
];

export const DebugDropdownOptions: MenuItemType = {
    name: "Debug",
    className: "w-60",
    groups: [DebugDropdownOptionGroup1],
};