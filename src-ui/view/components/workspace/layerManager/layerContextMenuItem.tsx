import { ArrowDown, ArrowUp, Brush, ClipboardPaste, Copy, Eraser, Folder, Grid3x3, PaintBucket, Plus, Redo, Scissors, Stamp, Trash2, Undo } from "lucide-react";

import { TilemapLayerService } from "@/shared/services/tilemapLayerService";
import { useLayerManagerStore } from "@/view/stores/application/layerManagerStore";

const CreateActionGroup: MenuDropDownGroupType = [
	{
		type: "subMenu",
		name: "Create",
		subMenusClassName: "w-60",
		startIcon: <Plus className="stroke-2" />,
		subMenus: [
			[
				{
					type: "option",
					name: "New Tile Layer",
					startIcon: <Grid3x3 />,
					onClick() { TilemapLayerService.createNewTileLayer() },
				},
				{
					type: "option",
					name: "New Group Layer",
					startIcon: <Folder />,
					onClick() { TilemapLayerService.createNewGroupLayer() },
				},
			],
		],
	},
	{
		type: "subMenu",
		name: "Group",
		subMenusClassName: "w-60",
		subMenus: [
			[
				{
					type: "option",
					name: "Group layer",
					disabled: () => {
						const numberOfLayers = useLayerManagerStore.getState().selectedIds.size;
						return numberOfLayers < 1;
					},
					onClick() {},
				},
				{
					type: "option",
					name: "Ungroup layer",
					disabled: () => {
						const numberOfLayers = useLayerManagerStore.getState().selectedIds.size;
						return numberOfLayers < 1;
					},
					onClick() {},
				},
			],
		],
	},
	{
		type: "option",
		name: "Duplicate layer",
		startIcon: <Copy />,
		onClick() {},
	},
	{
		type: "option",
		name: "Remove layer",
		startIcon: <Trash2 />,
		onClick() {},
	},
];

const MoveLayerActionGroup: MenuDropDownGroupType = [
	{
		type: "option",
		name: "Select all layer",
		onClick() {},
	},
	{
		type: "option",
		name: "Raise layer",
		startIcon: <ArrowUp />,
		disabled: () => {
			const numberOfLayers = useLayerManagerStore.getState().selectedIds.size;
			return numberOfLayers != 1;
		},
		onClick() {},
	},
	{
		type: "option",
		name: "Lower layer",
		startIcon: <ArrowDown />,
		disabled: () => {
			const numberOfLayers = useLayerManagerStore.getState().selectedIds.size;
			return numberOfLayers != 1;
		},
		onClick() {},
	},
];

const PropertiesActionGroup: MenuDropDownGroupType = [
	{
		type: "option",
		name: "Show/Hide layers",
		onClick() {},
        disabled: () => {
			const numberOfLayers = useLayerManagerStore.getState().selectedIds.size;
			return numberOfLayers < 1;
		},
	},
	{
		type: "option",
		name: "Lock/Unlock layers",
        disabled: () => {
			const numberOfLayers = useLayerManagerStore.getState().selectedIds.size;
			return numberOfLayers < 1;
		},
		onClick() {},
	},
];

export const LayerManagerContextMenu: MenuItemType = {
	name: "LayerManager",
	className: "w-60 bg-secondary-background",
	groups: [CreateActionGroup, MoveLayerActionGroup, PropertiesActionGroup],
};
