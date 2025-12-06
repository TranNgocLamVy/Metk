import { AppCore } from "@/core/appcore";
import { useDebugStore } from "@/view/stores/debug/debugStore";
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
        name: "Create Tilemap",
        onClick() {
            AppCore.getIns().projectManager.currentProject?.tilemapManager.createTilemap();
        }
    }
];

export const DebugDropdownOptions: MenuItemType = {
    name: "Debug",
    className: "w-60",
    groups: [DebugDropdownOptionGroup1],
};