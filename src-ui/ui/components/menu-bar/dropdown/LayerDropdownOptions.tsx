import { appKernel } from "@/application/bootstrap/app-kernel";
import * as TilemapLayerActions from "@/application/actions/tilemap-layer.actions";
import { ArrowDown, ArrowDownToLine, ArrowUp, ArrowUpToLine, Columns3Cog, Copy, Eye, Folder, Grid2X2, Group, Image, Layers, Layers2, Lock, Scan, Scissors, Shapes, Trash2, Ungroup } from "lucide-react";

const isTilemapSessionOpen = (): boolean => {
	const editorFacade = appKernel.editorFacade;
	const tilemapSession = editorFacade.getActiveTilemapSession();
	return !!tilemapSession;
}

const numSelectedLayers = (): number => {
	const editorFacade = appKernel.editorFacade;
	const tilemapSession = editorFacade.getActiveTilemapSession();
	if (!tilemapSession) return 0;
	return tilemapSession.layerState.selectedLayers.length;
}

const LayerDropdownOptionGroup1: MenuDropDownGroupType = [
	{
		type: "subMenu",
		label: "menu.layer.action.newLayer.label",
		startIcon: <Layers className="stroke-1" />,
		subMenus: [
			[
				{
					type: "option",
					label: "menu.layer.action.newLayer.tileLayer",
					startIcon: <Grid2X2 />,
					disabled: () => numSelectedLayers() == 0,
					onClick: () => TilemapLayerActions.createNewTileLayer()
				},
				{
					type: "option",
					label: "menu.layer.action.newLayer.ruleLayer",
					startIcon: <Grid2X2 />,
					disabled: () => numSelectedLayers() == 0,
					onClick: () => TilemapLayerActions.createNewRuleLayer()
				},
				{
					type: "option",
					label: "menu.layer.action.newLayer.objectLayer",
					startIcon: <Shapes />,
					disabled: () => true,
					visible: () => false,
					onClick() { },

				},
				{
					type: "option",
					label: "menu.layer.action.newLayer.imageLayer",
					startIcon: <Image />,
					disabled: () => true,
					visible: () => false,
					onClick() { },
				},
				{
					type: "option",
					label: "menu.layer.action.newLayer.groupLayer",
					startIcon: <Folder />,
					disabled: () => !isTilemapSessionOpen(),
					onClick: () => TilemapLayerActions.createNewGroupLayer()
				},
			],
			[
				{
					type: "option",
					label: "menu.layer.action.newLayer.layerViaCopy",
					startIcon: <Copy />,
					disabled: () => true,
					onClick() { },
				},
				{
					type: "option",
					label: "menu.layer.action.newLayer.layerViaCut",
					startIcon: <Scissors />,
					disabled: () => true,
					onClick() { },
				},
			],
		],
	},
	{
		type: "subMenu",
		label: "menu.layer.action.group.label",
		startIcon: <Group className="stroke-1" />,
		subMenus: [
			[
				{
					type: "option",
					label: "menu.layer.action.group.groupLayer",
					startIcon: <Group />,
					disabled: () => numSelectedLayers() == 0,
					onClick() { },
				},
				{
					type: "option",
					label: "menu.layer.action.group.ungroupLayer",
					startIcon: <Ungroup />,
					disabled: () => numSelectedLayers() == 0,
					onClick() { },
				},
			],
		],
	},
	{
		type: "option",
		label: "menu.layer.action.duplicateLayer",
		startIcon: <Layers2 />,
		disabled: () => numSelectedLayers() == 0,
		onClick: () => TilemapLayerActions.duplicateLayer(),
	},
	{
		type: "option",
		label: "menu.layer.action.mergeLayerUp",
		startIcon: <ArrowUpToLine />,
		visible: () => false,
		disabled: () => numSelectedLayers() == 0,
		onClick() { },
	},
	{
		type: "option",
		label: "menu.layer.action.mergeLayerDown",
		startIcon: <ArrowDownToLine />,
		visible: () => false,
		disabled: () => numSelectedLayers() == 0,
		onClick() { },
	},
	{
		type: "option",
		label: "menu.layer.action.deleteLayer",
		startIcon: <Trash2 />,
		disabled: () => numSelectedLayers() == 0,
		onClick: () => TilemapLayerActions.deleteLayer(),
	},
];

const LayerDropdownOptionGroup2: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.layer.action.selectAllLayers",
		startIcon: <Scan />,
		disabled: () => !isTilemapSessionOpen(),
		onClick: () => TilemapLayerActions.selectAllLayers(),
	},
	{
		type: "option",
		label: "menu.layer.action.raiseLayer",
		startIcon: <ArrowUp />,
		disabled: () => numSelectedLayers() != 1,
		onClick: () => TilemapLayerActions.moveLayersUp(),
	},
	{
		type: "option",
		label: "menu.layer.action.lowerLayer",
		startIcon: <ArrowDown />,
		disabled: () => numSelectedLayers() != 1,
		onClick: () => TilemapLayerActions.moveLayersDown(),
	},
];

const LayerDropdownOptionGroup3: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.layer.action.showHideLayer",
		startIcon: <Eye />,
		disabled: () => numSelectedLayers() == 0,
		onClick: () => TilemapLayerActions.toggleSelectedLayersVisibility(),
	},
	{
		type: "option",
		label: "menu.layer.action.lockUnlockLayer",
		startIcon: <Lock />,
		disabled: () => numSelectedLayers() == 0,
		onClick: () => TilemapLayerActions.toggleSelectedLayersLock(),
	},
	{
		type: "option",
		label: "menu.layer.action.showHideOtherLayers",
		startIcon: <Eye />,
		disabled: () => !isTilemapSessionOpen(),
		onClick: () => TilemapLayerActions.toggleNonSelectedLayersVisibility(),
	},
	{
		type: "option",
		label: "menu.layer.action.lockUnlockOtherLayers",
		startIcon: <Lock />,
		disabled: () => !isTilemapSessionOpen(),
		onClick: () => TilemapLayerActions.toggleNonSelectedLayersLock(),
	},
]

const LayerDropdownOptionGroup4: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.layer.action.layerProperties",
		startIcon: <Columns3Cog />,
		disabled: () => true,
		onClick() { },
	},
]

export const LayerDropdownOptions: MenuItemType = {
	label: "menu.layer.label",
	className: "w-100",
	groups: [LayerDropdownOptionGroup1, LayerDropdownOptionGroup2, LayerDropdownOptionGroup3, LayerDropdownOptionGroup4],
};
