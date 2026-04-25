import { ArrowBigLeft, ArrowBigRight, Crop, Grid2x2Plus, Map, Move, SquareArrowUpRight } from "lucide-react";

import AutoGrid from "@/view/components/custom/icons/AutoGrid";
import { Label } from '@/view/components/shadcn/label';

const MapDropdownOptionGroup2: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.map.action.resizeMap",
        startIcon: <Move />,
		disabled: () => true,
		onClick() {},
	},
	{
		type: "option",
		label: "menu.map.action.cropToSelection",
        startIcon: <Crop />,
		disabled: () => true,
		onClick() {},
	},
	{
		type: "option",
		label: "menu.map.action.autoCrop",
        startIcon: <Crop />,
		disabled: () => true,
		onClick() {},
	},
	{
		type: "option",
		label: "menu.map.action.offsetMap",
        startIcon: <SquareArrowUpRight />,
		disabled: () => true,
		onClick() {},
	},
];

const MapDropdownOptionGroup4: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.map.action.selectNextTileset",
        startIcon: <ArrowBigRight />,
		disabled: () => true,
		onClick() {},
	},
	{
		type: "option",
		label: "menu.map.action.selectPreviousTileset",
        startIcon: <ArrowBigLeft />,
		disabled: () => true,
		onClick() {},
	},
];

const MapDropdownOptionGroup5: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.map.action.mapProperties",
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
