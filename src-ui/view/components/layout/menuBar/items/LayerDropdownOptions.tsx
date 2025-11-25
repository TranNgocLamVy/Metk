import { ArrowBigLeft, ArrowBigRight, ArrowDown, ArrowDownToLine, ArrowUp, ArrowUpToLine, Columns3Cog, Copy, Eye, Folder, Grid2X2, Group, Image, Layers, Layers2, Lock, Scan, Scissors, Shapes, Trash2, Ungroup } from "lucide-react";

const LayerDropdownOptionGroup1: MenuDropDownGroupType = [
	{
		type: "subMenu",
		name: "New Layer",
        startIcon: <Layers className="stroke-1" />,
		subMenus: [
			[
				{
					type: "option",
					name: "Tile Layer",
                    startIcon: <Grid2X2 />,
					onClick() {},
				},
				{
					type: "option",
					name: "Object Layer",
                    startIcon: <Shapes />,
					onClick() {},

				},
				{
					type: "option",
					name: "Image Layer",
					onClick() {},
                    startIcon: <Image />,
				},
				{
					type: "option",
					name: "Group Layer",
                    startIcon: <Folder />,
					onClick() {},
				},
			],
			[
				{
					type: "option",
					name: "Layer via Copy",
                    startIcon: <Copy />,
					onClick() {},
				},
				{
					type: "option",
					name: "Layer via Cut",
                    startIcon: <Scissors />,
					onClick() {},
				},
			],
		],
	},
	{
		type: "subMenu",
		name: "Group",
        startIcon: <Group className="stroke-1" />,
		subMenus: [
			[
				{
					type: "option",
					name: "Group Layer",
                    startIcon: <Group />,
					onClick() {},
				},
				{
					type: "option",
					name: "Ungroup Layer",
                    startIcon: <Ungroup />,
					onClick() {},
				},
			],
		],
	},
	{
		type: "option",
		name: "Duplicate Layer",
        startIcon: <Layers2 />,
		onClick() {},
	},
    {
		type: "option",
		name: "Merge Layer Up",
        startIcon: <ArrowUpToLine />,
		onClick() {},
	},
    {
		type: "option",
		name: "Merge Layer Down",
        startIcon: <ArrowDownToLine />,
		onClick() {},
	},
    {
		type: "option",
		name: "Delete Layer",
        startIcon: <Trash2 />,
		onClick() {},
	},
];

const LayerDropdownOptionGroup2: MenuDropDownGroupType = [
    {
		type: "option",
		name: "Select Next Layer",
        startIcon: <ArrowBigRight />,
		onClick() {},
	},
    {
        type: "option",
		name: "Select Previous Layer",
        startIcon: <ArrowBigLeft />,
		onClick() {},
	},
    {
		type: "option",
		name: "Select All Layers",
        startIcon: <Scan />,
		onClick() {},
	},
    {
		type: "option",
		name: "Raise Layer",
        startIcon: <ArrowUp />,
		onClick() {},
	},
    {
		type: "option",
		name: "Lower Layer",
        startIcon: <ArrowDown />,
		onClick() {},
	},
];

const LayerDropdownOptionGroup3: MenuDropDownGroupType = [
    {
		type: "option",
		name: "Show/Hide Layer",
        startIcon: <Eye />,
		onClick() {},
	},
    {
		type: "option",
		name: "Lock/Unlock Layer",
        startIcon: <Lock />,
		onClick() {},
	},
    {
		type: "option",
		name: "Show/Hide other Layers",
        startIcon: <Eye />,
		onClick() {},
	},
    {
		type: "option",
		name: "Lock/Unlock other Layers",
        startIcon: <Lock />,
		onClick() {},
	},
]

const LayerDropdownOptionGroup4: MenuDropDownGroupType = [
    {
		type: "option",
		name: "Layer Properties",
        startIcon: <Columns3Cog />,
		onClick() {},
	},
]

export const LayerDropdownOptions: MenuItemType = {
	name: "Layer",
	className: "w-100",
	groups: [LayerDropdownOptionGroup1, LayerDropdownOptionGroup2, LayerDropdownOptionGroup3, LayerDropdownOptionGroup4],
};
