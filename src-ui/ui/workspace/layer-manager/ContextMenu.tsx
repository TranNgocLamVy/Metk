import { ArrowDown, ArrowUp, Boxes, Copy, Folder, Grid3x3, Image, Plus, Trash2 } from "lucide-react";

import * as TilemapLayerActions from "@/application/actions/tilemap-layer.actions";
import { getTilemapSessionStoreState } from "@/ui/stores/tilemap-session.store";

const isTilemapSessionOpen = (): boolean => {
	const activeSession = getTilemapSessionStoreState().activeSession;
	return !!activeSession;
}

const numSelectedLayers = (): number => {
	const activeSession = getTilemapSessionStoreState().activeSession;
	if (!activeSession) return 0;
	return activeSession.layerState.selectedLayers.length;
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
					onClick() { TilemapLayerActions.createNewTileLayer() },
				},
				{
					type: "option",
					label: "workspace.layerManager.contextMenu.new.ruleLayer",
					startIcon: <Grid3x3 className="text-yellow-300" />,
					disabled: () => !isTilemapSessionOpen(),
					onClick() { TilemapLayerActions.createNewRuleLayer() },
				},
				{
					type: "option",
					label: "workspace.layerManager.contextMenu.new.groupLayer",
					startIcon: <Folder className="text-blue-500" />,
					disabled: () => !isTilemapSessionOpen(),
					onClick() { TilemapLayerActions.createNewGroupLayer() },
				},
				{
					type: "option",
					label: "workspace.layerManager.contextMenu.new.entityLayer",
					startIcon: <Boxes className="text-cyan-400" />,
					disabled: () => !isTilemapSessionOpen(),
					onClick() { TilemapLayerActions.createNewEntityLayer() },
				},
				{
					type: "option",
					label: "workspace.layerManager.contextMenu.new.imageLayer",
					startIcon: <Image className="text-purple-400" />,
					disabled: () => !isTilemapSessionOpen(),
					onClick() {
						TilemapLayerActions.createNewImageLayer();
					},
				},
			],
		],
	},
	{
		type: "subMenu",
		label: "workspace.layerManager.contextMenu.group.label",
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
            TilemapLayerActions.duplicateLayer();
        },
	},
];

const MoveLayerActionGroup: MenuDropDownGroupType = [
	{
		type: "option",
		label: "workspace.layerManager.contextMenu.selectAll",
		onClick() { TilemapLayerActions.selectAllLayers() },
	},
    {
		type: "option",
		label: "workspace.layerManager.contextMenu.unselectAll",
        disabled: () => numSelectedLayers() == 0,
		onClick() { TilemapLayerActions.deselectAllLayers() },
	},
	{
		type: "option",
		label: "workspace.layerManager.contextMenu.raiseLayer",
		startIcon: <ArrowUp />,
		disabled: () => numSelectedLayers() != 1,
		onClick() {
            TilemapLayerActions.moveLayersUp();
        },
	},
	{
		type: "option",
		label: "workspace.layerManager.contextMenu.lowerLayer",
		startIcon: <ArrowDown />,
		disabled: () => numSelectedLayers() != 1,
		onClick() {
            TilemapLayerActions.moveLayersDown();
        },
	},
];

const PropertiesActionGroup: MenuDropDownGroupType = [
	{
		type: "option",
		label: "workspace.layerManager.contextMenu.showHide",
        disabled: () => numSelectedLayers() == 0,
		onClick() {
            TilemapLayerActions.toggleSelectedLayersVisibility();
        },
	},
	{
		type: "option",
		label: "workspace.layerManager.contextMenu.lockUnlock",
        disabled: () => numSelectedLayers() == 0,
		onClick() {
            TilemapLayerActions.toggleSelectedLayersLock();
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
            TilemapLayerActions.deleteLayer();
        },
	}
];

export const LayerManagerContextMenu: MenuItemType = {
	label: "workspace.layerManager.contextMenu.label",
	className: "w-80",
	groups: [CreateActionGroup, MoveLayerActionGroup, PropertiesActionGroup, DeleteActionGroup],
};
