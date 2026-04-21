import { ArrowBigLeft, ArrowBigRight, ArrowDown, ArrowDownToLine, ArrowUp, ArrowUpToLine, Columns3Cog, Copy, Eye, Folder, Grid2X2, Group, Image, Layers, Layers2, Lock, Scan, Scissors, Shapes, Trash2, Ungroup } from "lucide-react";

const LayerDropdownOptionGroup1: MenuDropDownGroupType = [
	{
		type: "subMenu",
		label: "menu.layer.actions.newLayer.label",
        startIcon: <Layers className="stroke-1" />,
		subMenus: [
			[
				{
					type: "option",
					label: "menu.layer.actions.newLayer.tileLayer",
                    startIcon: <Grid2X2 />,
					disabled: () => true,
					onClick() {},
				},
				{
					type: "option",
					label: "menu.layer.actions.newLayer.ruleLayer",
                    startIcon: <Grid2X2 />,
					disabled: () => true,
					onClick() {},
				},
				{
					type: "option",
					label: "menu.layer.actions.newLayer.objectLayer",
                    startIcon: <Shapes />,
					disabled: () => true,
					onClick() {},

				},
				{
					type: "option",
					label: "menu.layer.actions.newLayer.imageLayer",
                    startIcon: <Image />,
					disabled: () => true,
					onClick() {},
				},
				{
					type: "option",
					label: "menu.layer.actions.newLayer.groupLayer",
                    startIcon: <Folder />,
					disabled: () => true,
					onClick() {},
				},
			],
			[
				{
					type: "option",
					label: "menu.layer.actions.newLayer.layerViaCopy",
                    startIcon: <Copy />,
					disabled: () => true,
					onClick() {},
				},
				{
					type: "option",
					label: "menu.layer.actions.newLayer.layerViaCut",
                    startIcon: <Scissors />,
					disabled: () => true,
					onClick() {},
				},
			],
		],
	},
	{
		type: "subMenu",
		label: "menu.layer.actions.group.label",
        startIcon: <Group className="stroke-1" />,
		subMenus: [
			[
				{
					type: "option",
					label: "menu.layer.actions.group.groupLayer",
                    startIcon: <Group />,
					disabled: () => true,
					onClick() {},
				},
				{
					type: "option",
					label: "menu.layer.actions.group.ungroupLayer",
                    startIcon: <Ungroup />,
					disabled: () => true,
					onClick() {},
				},
			],
		],
	},
	{
		type: "option",
		label: "menu.layer.actions.duplicateLayer",
        startIcon: <Layers2 />,
		disabled: () => true,
		onClick() {},
	},
    {
		type: "option",
		label: "menu.layer.actions.mergeLayerUp",
        startIcon: <ArrowUpToLine />,
		disabled: () => true,
		onClick() {},
	},
    {
		type: "option",
		label: "menu.layer.actions.mergeLayerDown",
        startIcon: <ArrowDownToLine />,
		disabled: () => true,
		onClick() {},
	},
    {
		type: "option",
		label: "menu.layer.actions.deleteLayer",
        startIcon: <Trash2 />,
		disabled: () => true,
		onClick() {},
	},
];

const LayerDropdownOptionGroup2: MenuDropDownGroupType = [
    {
		type: "option",
		label: "menu.layer.actions.selectNextLayer",
        startIcon: <ArrowBigRight />,
		disabled: () => true,
		onClick() {},
	},
    {
        type: "option",
		label: "menu.layer.actions.selectPreviousLayer",
        startIcon: <ArrowBigLeft />,
		disabled: () => true,
		onClick() {},
	},
    {
		type: "option",
		label: "menu.layer.actions.selectAllLayers",
        startIcon: <Scan />,
		disabled: () => true,
		onClick() {},
	},
    {
		type: "option",
		label: "menu.layer.actions.raiseLayer",
        startIcon: <ArrowUp />,
		disabled: () => true,
		onClick() {},
	},
    {
		type: "option",
		label: "menu.layer.actions.lowerLayer",
        startIcon: <ArrowDown />,
		disabled: () => true,
		onClick() {},
	},
];

const LayerDropdownOptionGroup3: MenuDropDownGroupType = [
    {
		type: "option",
		label: "menu.layer.actions.showHideLayer",
        startIcon: <Eye />,
		disabled: () => true,
		onClick() {},
	},
    {
		type: "option",
		label: "menu.layer.actions.lockUnlockLayer",
        startIcon: <Lock />,
		disabled: () => true,
		onClick() {},
	},
    {
		type: "option",
		label: "menu.layer.actions.showHideOtherLayers",
        startIcon: <Eye />,
		disabled: () => true,
		onClick() {},
	},
    {
		type: "option",
		label: "menu.layer.actions.lockUnlockOtherLayers",
        startIcon: <Lock />,
		disabled: () => true,
		onClick() {},
	},
]

const LayerDropdownOptionGroup4: MenuDropDownGroupType = [
    {
		type: "option",
		label: "menu.layer.actions.layerProperties",
        startIcon: <Columns3Cog />,
		disabled: () => true,
		onClick() {},
	},
]

export const LayerDropdownOptions: MenuItemType = {
	label: "menu.layer.label",
	className: "w-100",
	groups: [LayerDropdownOptionGroup1, LayerDropdownOptionGroup2, LayerDropdownOptionGroup3, LayerDropdownOptionGroup4],
};
