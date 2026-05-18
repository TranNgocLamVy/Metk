import { appKernel } from "@/application/bootstrap/app-kernel";
import { TilemapLayerService } from "@/shared/services/tilemap-layer.service";
import { ArrowDown, ArrowDownToLine, ArrowUp, ArrowUpToLine, Columns3Cog, Copy, Eye, Folder, Grid2X2, Group, Image, Layers, Layers2, Lock, Scan, Scissors, Shapes, Trash2, Ungroup } from "lucide-react";

const isTilemapSessionOpen = (): boolean => {
	const editorContext = appKernel.editorContext;
	const tilemapSession = editorContext.getActiveTilemapSession();
	return !!tilemapSession;
}

const numSelectedLayers = (): number => {
	const editorContext = appKernel.editorContext;
	const tilemapSession = editorContext.getActiveTilemapSession();
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
					onClick: () => TilemapLayerService.createNewTileLayer()
				},
				{
					type: "option",
					label: "menu.layer.action.newLayer.ruleLayer",
					startIcon: <Grid2X2 />,
					disabled: () => numSelectedLayers() == 0,
					onClick: () => TilemapLayerService.createNewRuleLayer()
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
					onClick: () => TilemapLayerService.createNewGroupLayer()
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
		onClick: () => TilemapLayerService.duplicateLayer(),
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
		onClick: () => TilemapLayerService.deleteLayer(),
	},
];

const LayerDropdownOptionGroup2: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.layer.action.selectAllLayers",
		startIcon: <Scan />,
		disabled: () => !isTilemapSessionOpen(),
		onClick: () => TilemapLayerService.selectAllLayers(),
	},
	{
		type: "option",
		label: "menu.layer.action.raiseLayer",
		startIcon: <ArrowUp />,
		disabled: () => numSelectedLayers() != 1,
		onClick: () => TilemapLayerService.moveLayersUp(),
	},
	{
		type: "option",
		label: "menu.layer.action.lowerLayer",
		startIcon: <ArrowDown />,
		disabled: () => numSelectedLayers() != 1,
		onClick: () => TilemapLayerService.moveLayersDown(),
	},
];

const LayerDropdownOptionGroup3: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.layer.action.showHideLayer",
		startIcon: <Eye />,
		disabled: () => numSelectedLayers() == 0,
		onClick: () => TilemapLayerService.toggleSelectedLayersVisibility(),
	},
	{
		type: "option",
		label: "menu.layer.action.lockUnlockLayer",
		startIcon: <Lock />,
		disabled: () => numSelectedLayers() == 0,
		onClick: () => TilemapLayerService.toggleSelectedLayersLock(),
	},
	{
		type: "option",
		label: "menu.layer.action.showHideOtherLayers",
		startIcon: <Eye />,
		disabled: () => !isTilemapSessionOpen(),
		onClick: () => TilemapLayerService.toggleNonSelectedLayersVisibility(),
	},
	{
		type: "option",
		label: "menu.layer.action.lockUnlockOtherLayers",
		startIcon: <Lock />,
		disabled: () => !isTilemapSessionOpen(),
		onClick: () => TilemapLayerService.toggleNonSelectedLayersLock(),
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
