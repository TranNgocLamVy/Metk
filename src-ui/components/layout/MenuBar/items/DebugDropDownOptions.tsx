import { useNavigationStore } from "@/stores/ui/NavigationStore";

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
];

export const DebugDropdownOptions: MenuItemType = {
    name: "Debug",
    className: "w-60",
    groups: [DebugDropdownOptionGroup1],
};