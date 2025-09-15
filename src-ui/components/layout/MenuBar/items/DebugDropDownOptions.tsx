import { useDebugStore } from "@/stores/debug/DebugStore";
import { useNavigationStore } from "@/stores/menu/NavigationStore";

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
		name: "Test",
        onClick() {
            useNavigationStore.getState().navigate?.("/test");
        },
	},
	{
		type: "option",
		name: "Rerender",
        onClick() {
            useDebugStore.getState().rerender();
        },
	},
];

export const DebugDropdownOptions: MenuItemType = {
    name: "Debug",
    className: "w-60",
    groups: [DebugDropdownOptionGroup1],
};