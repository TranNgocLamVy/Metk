import { ArrowBigLeft, ArrowBigRight, Crop, Grid2x2Plus, Map, Move, SquareArrowUpRight } from "lucide-react";

import AutoGrid from "@/view/components/custom/icons/AutoGrid";
import { Label } from '@/view/components/shadcn/label';

const MapDropdownOptionGroup2: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.map.actions.resizeMap",
        startIcon: <Move />,
		disabled: () => true,
		onClick() {},
	},
	{
		type: "option",
		label: "menu.map.actions.cropToSelection",
        startIcon: <Crop />,
		disabled: () => true,
		onClick() {},
	},
	{
		type: "option",
		label: "menu.map.actions.autoCrop",
        startIcon: <Crop />,
		disabled: () => true,
		onClick() {},
	},
	{
		type: "option",
		label: "menu.map.actions.offsetMap",
        startIcon: <SquareArrowUpRight />,
		disabled: () => true,
		onClick() {},
	},
];

const MapDropdownOptionGroup4: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.map.actions.selectNextTileset",
        startIcon: <ArrowBigRight />,
		disabled: () => true,
		onClick() {},
	},
	{
		type: "option",
		label: "menu.map.actions.selectPreviousTileset",
        startIcon: <ArrowBigLeft />,
		disabled: () => true,
		onClick() {},
	},
];

const MapDropdownOptionGroup5: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.map.actions.mapProperties",
		startIcon: <Map />,
		disabled: () => true,
		onClick() {},
	},
];

export const MapDropdownOptions: MenuItemType = {
	label: "menu.map.label",
	className: "w-100",
	groups: [MapDropdownOptionGroup2, MapDropdownOptionGroup4, MapDropdownOptionGroup5],
};
