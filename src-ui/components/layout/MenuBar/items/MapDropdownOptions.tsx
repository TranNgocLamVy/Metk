import { ArrowBigLeft, ArrowBigRight, Crop, Grid2x2Plus, Map, Move, SquareArrowUpRight } from "lucide-react";
import AutoGrid from '@/components/custom/icons/AutoGrid';

const MapDropdownOptionGroup1: MenuBarDropDownGroupType = [
	{
		type: "option",
		name: "Add External Tileset",
		startIcon: <Grid2x2Plus />,
		onClick() {},
	},
	{
		type: "option",
		name: "Add AutoTile Rule Tileset",
		startIcon: <AutoGrid />,
		onClick() {},
	},
];

const MapDropdownOptionGroup2: MenuBarDropDownGroupType = [
	{
		type: "option",
		name: "Resize Map",
        startIcon: <Move />,
		onClick() {},
	},
	{
		type: "option",
		name: "Crop to Selection",
        startIcon: <Crop />,
		onClick() {},
	},
	{
		type: "option",
		name: "Auto Crop",
        startIcon: <Crop />,
		onClick() {},
	},
	{
		type: "option",
		name: "Offset Map",
        startIcon: <SquareArrowUpRight />,
		onClick() {},
	},
];

const MapDropdownOptionGroup3: MenuBarDropDownGroupType = [
	{
		type: "option",
		name: "AutoMap",
        startIcon: <AutoGrid />,
		onClick() {},
	},
	{
		type: "check",
		name: "AutoMap while mapping",
		checked: () => true,
		onCheckedChange(checked) {},
	},
];

const MapDropdownOptionGroup4: MenuBarDropDownGroupType = [
	{
		type: "option",
		name: "Select Next Tileset",
        startIcon: <ArrowBigRight />,
		onClick() {},
	},
	{
		type: "option",
		name: "AutoMap Previous Tileset",
        startIcon: <ArrowBigLeft />,
		onClick() {},
	},
];

const MapDropdownOptionGroup5: MenuBarDropDownGroupType = [
	{
		type: "option",
		name: "Map Properties",
		startIcon: <Map />,
		onClick() {},
	},
];

export const MapDropdownOptions: MenuBarItemType = {
	name: "Map",
	className: "w-70",
	groups: [MapDropdownOptionGroup1, MapDropdownOptionGroup2, MapDropdownOptionGroup3, MapDropdownOptionGroup4, MapDropdownOptionGroup5],
};
