import { ArrowDown, ArrowUp, Copy, Folder, Grid3x3, Plus, Trash2 } from "lucide-react";

import { TilemapLayerService } from "@/shared/services/tilemapLayerService";
import { useLayerManagerStore } from "@/view/stores/layerManagerStore";

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
					onClick() { TilemapLayerService.createNewTileLayer() },
				},
				{
					type: "option",
					label: "workspace.layerManager.contextMenu.new.ruleLayer",
					startIcon: <Grid3x3 className="text-yellow-300" />,
					onClick() { TilemapLayerService.createNewRuleLayer() },
				},
				{
					type: "option",
					label: "workspace.layerManager.contextMenu.new.groupLayer",
					startIcon: <Folder className="text-blue-500" />,
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
					disabled: () => {
						const numberOfLayers = useLayerManagerStore.getState().getSelectedLayers().length;
						return numberOfLayers < 1;
					},
					onClick() {},
				},
				{
					type: "option",
					label: "workspace.layerManager.contextMenu.group.ungroupLayer",
					disabled: () => {
						const numberOfLayers = useLayerManagerStore.getState().getSelectedLayers().length;
						return numberOfLayers < 1;
					},
					onClick() {},
				},
			],
		],
	},
	{
		type: "option",
		label: "workspace.layerManager.contextMenu.duplicate",
		startIcon: <Copy />,
		disabled: () => {
            const numberOfLayers = useLayerManagerStore.getState().getSelectedLayers().length;
            return numberOfLayers < 1;
        },
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
        disabled: () => {
            const numberOfLayers = useLayerManagerStore.getState().getSelectedLayers().length;
            return numberOfLayers < 1;
        },
		onClick() { TilemapLayerService.deselectAllLayers() },
	},
	{
		type: "option",
		label: "workspace.layerManager.contextMenu.raiseLayer",
		startIcon: <ArrowUp />,
		disabled: () => {
			const numberOfLayers = useLayerManagerStore.getState().getSelectedLayers().length;
			return numberOfLayers != 1;
		},
		onClick() {
            TilemapLayerService.moveLayersUp();
        },
	},
	{
		type: "option",
		label: "workspace.layerManager.contextMenu.lowerLayer",
		startIcon: <ArrowDown />,
		disabled: () => {
			const numberOfLayers = useLayerManagerStore.getState().getSelectedLayers().length;
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
		label: "workspace.layerManager.contextMenu.showHide",
        disabled: () => {
			const numberOfLayers = useLayerManagerStore.getState().getSelectedLayers().length;
			return numberOfLayers < 1;
		},
		onClick() {
            const selectedLayers = useLayerManagerStore.getState().getSelectedLayers()
            TilemapLayerService.toggleVisibility([...selectedLayers]);
        },
	},
	{
		type: "option",
		label: "workspace.layerManager.contextMenu.lockUnlock",
        disabled: () => {
			const numberOfLayers = useLayerManagerStore.getState().getSelectedLayers().length;
			return numberOfLayers < 1;
		},
		onClick() {
            const selectedLayers = useLayerManagerStore.getState().getSelectedLayers()
            TilemapLayerService.toggleLock([...selectedLayers]);
        },
	},
];

const DeleteActionGroup: MenuDropDownGroupType = [
	{
		type: "option",
		label: "workspace.layerManager.contextMenu.delete",
		startIcon: <Trash2 />,
		variant: "destructive",
        disabled: () => {
            const numberOfLayers = useLayerManagerStore.getState().getSelectedLayers().length;
            return numberOfLayers < 1;
        },
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
