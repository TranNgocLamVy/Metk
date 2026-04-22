import { ArrowDown, ArrowUp, Copy, Folder, Grid3x3, Plus, Trash2 } from "lucide-react";

import { TilemapLayerService } from "@/shared/services/tilemapLayerService";
import { appCore } from "@/core/appcore";

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

const CreateActionGroup: MenuDropDownGroupType = [
	{
		type: "subMenu",
		label: "workspace.layerManager.contextMenu.new.label",
		subMenusClassName: "w-60",
		startIcon: <Plus className="stroke-2" />,
		subMenus: [
			[
				{
					type: "option",
					label: "workspace.layerManager.contextMenu.new.tileLayer",
					startIcon: <Grid3x3 className="text-emerald-500" />,
					disabled: () => !isTilemapSessionOpen(),
					onClick() { TilemapLayerService.createNewTileLayer() },
				},
				{
					type: "option",
					label: "workspace.layerManager.contextMenu.new.ruleLayer",
					startIcon: <Grid3x3 className="text-yellow-300" />,
					disabled: () => !isTilemapSessionOpen(),
					onClick() { TilemapLayerService.createNewRuleLayer() },
				},
				{
					type: "option",
					label: "workspace.layerManager.contextMenu.new.groupLayer",
					startIcon: <Folder className="text-blue-500" />,
					disabled: () => !isTilemapSessionOpen(),
					onClick() { TilemapLayerService.createNewGroupLayer() },
				},
			],
		],
	},
	{
		type: "subMenu",
		label: "Group",
		subMenusClassName: "w-60",
		subMenus: [
			[
				{
					type: "option",
					label: "workspace.layerManager.contextMenu.group.groupLayer",
					disabled: () => numSelectedLayers() == 0,
					onClick() {},
				},
				{
					type: "option",
					label: "workspace.layerManager.contextMenu.group.ungroupLayer",
					disabled: () => numSelectedLayers() == 0,
					onClick() {},
				},
			],
		],
	},
	{
		type: "option",
		label: "workspace.layerManager.contextMenu.duplicate",
		startIcon: <Copy />,
		disabled: () => numSelectedLayers() == 0,
		onClick() {
            TilemapLayerService.duplicateLayer();
        },
	},
];

const MoveLayerActionGroup: MenuDropDownGroupType = [
	{
		type: "option",
		label: "workspace.layerManager.contextMenu.selectAll",
		onClick() { TilemapLayerService.selectAllLayers() },
	},
    {
		type: "option",
		label: "workspace.layerManager.contextMenu.unselectAll",
        disabled: () => numSelectedLayers() == 0,
		onClick() { TilemapLayerService.deselectAllLayers() },
	},
	{
		type: "option",
		label: "workspace.layerManager.contextMenu.raiseLayer",
		startIcon: <ArrowUp />,
		disabled: () => numSelectedLayers() != 1,
		onClick() {
            TilemapLayerService.moveLayersUp();
        },
	},
	{
		type: "option",
		label: "workspace.layerManager.contextMenu.lowerLayer",
		startIcon: <ArrowDown />,
		disabled: () => numSelectedLayers() != 1,
		onClick() {
            TilemapLayerService.moveLayersDown();
        },
	},
];

const PropertiesActionGroup: MenuDropDownGroupType = [
	{
		type: "option",
		label: "workspace.layerManager.contextMenu.showHide",
        disabled: () => numSelectedLayers() == 0,
		onClick() {
            TilemapLayerService.toggleSelectedLayersVisibility();
        },
	},
	{
		type: "option",
		label: "workspace.layerManager.contextMenu.lockUnlock",
        disabled: () => numSelectedLayers() == 0,
		onClick() {
            TilemapLayerService.toggleSelectedLayersLock();
        },
	},
];

const DeleteActionGroup: MenuDropDownGroupType = [
	{
		type: "option",
		label: "workspace.layerManager.contextMenu.delete",
		startIcon: <Trash2 />,
		variant: "destructive",
        disabled: () => numSelectedLayers() == 0,
		onClick() {
            TilemapLayerService.deleteLayer();
        },
	}
];

export const LayerManagerContextMenu: MenuItemType = {
	label: "workspace.layerManager.contextMenu.label",
	className: "w-80",
	groups: [CreateActionGroup, MoveLayerActionGroup, PropertiesActionGroup, DeleteActionGroup],
};
