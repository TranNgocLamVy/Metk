import { appCore } from "@/core/appcore";
import { TilemapLayerService } from "@/shared/services/tilemapLayerService";
import { ArrowDown, ArrowDownToLine, ArrowUp, ArrowUpToLine, Columns3Cog, Copy, Eye, Folder, Grid2X2, Group, Image, Layers, Layers2, Lock, Scan, Scissors, Shapes, Trash2, Ungroup } from "lucide-react";

const isTilemapSessionOpen = (): boolean => {
	const editorContext = appCore.editorContext;
	const tilemapSession = editorContext.getCurrentTilemapSession();
	return !!tilemapSession;
}

const numSelectedLayers = (): number => {
	const editorContext = appCore.editorContext;
	const tilemapSession = editorContext.getCurrentTilemapSession();
	if (!tilemapSession) return 0;
	return tilemapSession.layerState.selectedLayers.length;
}

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
					disabled: () => numSelectedLayers() == 0,
					onClick: () => TilemapLayerService.createNewTileLayer()
				},
				{
					type: "option",
					label: "menu.layer.actions.newLayer.ruleLayer",
					startIcon: <Grid2X2 />,
					disabled: () => numSelectedLayers() == 0,
					onClick: () => TilemapLayerService.createNewRuleLayer()
				},
				{
					type: "option",
					label: "menu.layer.actions.newLayer.objectLayer",
					startIcon: <Shapes />,
					disabled: () => true,
					visible: () => false,
					onClick() { },

				},
				{
					type: "option",
					label: "menu.layer.actions.newLayer.imageLayer",
					startIcon: <Image />,
					disabled: () => true,
					visible: () => false,
					onClick() { },
				},
				{
					type: "option",
					label: "menu.layer.actions.newLayer.groupLayer",
					startIcon: <Folder />,
					disabled: () => !isTilemapSessionOpen(),
					onClick: () => TilemapLayerService.createNewGroupLayer()
				},
			],
			[
				{
					type: "option",
					label: "menu.layer.actions.newLayer.layerViaCopy",
					startIcon: <Copy />,
					disabled: () => true,
					onClick() { },
				},
				{
					type: "option",
					label: "menu.layer.actions.newLayer.layerViaCut",
					startIcon: <Scissors />,
					disabled: () => true,
					onClick() { },
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
					disabled: () => numSelectedLayers() == 0,
					onClick() { },
				},
				{
					type: "option",
					label: "menu.layer.actions.group.ungroupLayer",
					startIcon: <Ungroup />,
					disabled: () => numSelectedLayers() == 0,
					onClick() { },
				},
			],
		],
	},
	{
		type: "option",
		label: "menu.layer.actions.duplicateLayer",
		startIcon: <Layers2 />,
		disabled: () => numSelectedLayers() == 0,
		onClick: () => TilemapLayerService.duplicateLayer(),
	},
	{
		type: "option",
		label: "menu.layer.actions.mergeLayerUp",
		startIcon: <ArrowUpToLine />,
		visible: () => false,
		disabled: () => numSelectedLayers() == 0,
		onClick() { },
	},
	{
		type: "option",
		label: "menu.layer.actions.mergeLayerDown",
		startIcon: <ArrowDownToLine />,
		visible: () => false,
		disabled: () => numSelectedLayers() == 0,
		onClick() { },
	},
	{
		type: "option",
		label: "menu.layer.actions.deleteLayer",
		startIcon: <Trash2 />,
		disabled: () => numSelectedLayers() == 0,
		onClick: () => TilemapLayerService.deleteLayer(),
	},
];

const LayerDropdownOptionGroup2: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.layer.actions.selectAllLayers",
		startIcon: <Scan />,
		disabled: () => !isTilemapSessionOpen(),
		onClick: () => TilemapLayerService.selectAllLayers(),
	},
	{
		type: "option",
		label: "menu.layer.actions.raiseLayer",
		startIcon: <ArrowUp />,
		disabled: () => numSelectedLayers() != 1,
		onClick: () => TilemapLayerService.moveLayersUp(),
	},
	{
		type: "option",
		label: "menu.layer.actions.lowerLayer",
		startIcon: <ArrowDown />,
		disabled: () => numSelectedLayers() != 1,
		onClick: () => TilemapLayerService.moveLayersDown(),
	},
];

const LayerDropdownOptionGroup3: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.layer.actions.showHideLayer",
		startIcon: <Eye />,
		disabled: () => numSelectedLayers() == 0,
		onClick: () => TilemapLayerService.toggleSelectedLayersVisibility(),
	},
	{
		type: "option",
		label: "menu.layer.actions.lockUnlockLayer",
		startIcon: <Lock />,
		disabled: () => numSelectedLayers() == 0,
		onClick: () => TilemapLayerService.toggleSelectedLayersLock(),
	},
	{
		type: "option",
		label: "menu.layer.actions.showHideOtherLayers",
		startIcon: <Eye />,
		disabled: () => !isTilemapSessionOpen(),
		onClick: () => TilemapLayerService.toggleNonSelectedLayersVisibility(),
	},
	{
		type: "option",
		label: "menu.layer.actions.lockUnlockOtherLayers",
		startIcon: <Lock />,
		disabled: () => !isTilemapSessionOpen(),
		onClick: () => TilemapLayerService.toggleNonSelectedLayersLock(),
	},
]

const LayerDropdownOptionGroup4: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.layer.actions.layerProperties",
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
