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
						const numberOfLayers = useLayerManagerStore.getState().selectedIds.length;
						return numberOfLayers < 1;
					},
					onClick() {},
				},
				{
					type: "option",
					name: "Ungroup layer",
					disabled: () => {
						const numberOfLayers = useLayerManagerStore.getState().selectedIds.length;
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
		onClick() {
            TilemapLayerService.duplicateLayer();
        },
	},
];

const MoveLayerActionGroup: MenuDropDownGroupType = [
	{
		type: "option",
		name: "Select all layer",
		onClick() { TilemapLayerService.selectAllLayers() },
	},
    {
		type: "option",
		name: "Unselect all layer",
        disabled: () => {
            const numberOfLayers = useLayerManagerStore.getState().selectedIds.length;
            return numberOfLayers < 1;
        },
		onClick() { TilemapLayerService.deselectAllLayers() },
	},
	{
		type: "option",
		name: "Raise layer",
		startIcon: <ArrowUp />,
		disabled: () => {
			const numberOfLayers = useLayerManagerStore.getState().selectedIds.length;
			return numberOfLayers != 1;
		},
		onClick() {
            TilemapLayerService.moveLayersUp();
        },
	},
	{
		type: "option",
		name: "Lower layer",
		startIcon: <ArrowDown />,
		disabled: () => {
			const numberOfLayers = useLayerManagerStore.getState().selectedIds.length;
			return numberOfLayers != 1;
		},
		onClick() {
            TilemapLayerService.moveLayersDown();
        },
	},
];

const PropertiesActionGroup: MenuDropDownGroupType = [
	{
		type: "option",
		name: "Show/Hide layers",
        disabled: () => {
			const numberOfLayers = useLayerManagerStore.getState().selectedIds.length;
			return numberOfLayers < 1;
		},
		onClick() {
            const selectedLayers = useLayerManagerStore.getState().selectedIds
            TilemapLayerService.toggleVisibility([...selectedLayers]);
        },
	},
	{
		type: "option",
		name: "Lock/Unlock layers",
        disabled: () => {
			const numberOfLayers = useLayerManagerStore.getState().selectedIds.length;
			return numberOfLayers < 1;
		},
		onClick() {
            const selectedLayers = useLayerManagerStore.getState().selectedIds
            TilemapLayerService.toggleLock([...selectedLayers]);
        },
	},
];

const DeleteActionGroup: MenuDropDownGroupType = [
	{
		type: "option",
		name: "Remove layer",
		startIcon: <Trash2 />,
		variant: "destructive",
        disabled: () => {
            const numberOfLayers = useLayerManagerStore.getState().selectedIds.length;
            return numberOfLayers < 1;
        },
		onClick() {
            TilemapLayerService.deleteLayer();
        },
	}
];

export const LayerManagerContextMenu: MenuItemType = {
	name: "LayerManager",
	className: "w-60 bg-secondary-background",
	groups: [CreateActionGroup, MoveLayerActionGroup, PropertiesActionGroup, DeleteActionGroup],
};
