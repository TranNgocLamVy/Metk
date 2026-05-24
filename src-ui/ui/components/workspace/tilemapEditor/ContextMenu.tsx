import { Brush, ClipboardPaste, Copy, Eraser, Grid3x3, Info, Pen, Plus, Redo, Scissors, Stamp, Trash2, Undo } from "lucide-react";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { TilemapService } from "@/shared/services/tilemap.service";
import { usePropertyStore } from "@/ui/stores/property.store";

const ActionGroup: MenuDropDownGroupType = [
    {
        type: "option",
        label: "workspace.tilemapEditor.contextMenu.new",
        startIcon: <Plus className="stroke-1" />,
        onClick() {
            TilemapService.createTilemap();
        }
    },
    {
        type: "option",
        label: "workspace.tilemapEditor.contextMenu.property",
        startIcon: <Info className="stroke-1" />,
        onClick() {
			const activeTilemapSession = appKernel.editorFacade.getActiveTilemapSession();
			if (!activeTilemapSession) return;
			usePropertyStore.getState().setObjectId(activeTilemapSession.tilemap.objectId);
        }
    },
];

const UndoRedoGroup: MenuDropDownGroupType = [
	{
		type: "option",
		label: "workspace.tilemapEditor.contextMenu.undo",
		startIcon: <Undo />,
		disabled() {
			const editorFacade = appKernel.editorFacade;
			const historyManager = editorFacade.getCurrentHistoryManager();
			return !historyManager?.canUndo;
		},
		onClick() {
			const editorFacade = appKernel.editorFacade;
			editorFacade.getCurrentHistoryManager()?.undo(editorFacade);
		},
	},
	{
		type: "option",
		label: "workspace.tilemapEditor.contextMenu.redo",
		startIcon: <Redo />,
		disabled() {
			const editorFacade = appKernel.editorFacade;
			const historyManager = editorFacade.getCurrentHistoryManager();
			return !historyManager?.canRedo;
		},
		onClick() {
			const editorFacade = appKernel.editorFacade;
			editorFacade.getCurrentHistoryManager()?.redo(editorFacade);
		},
	},
];

const EditGroup: MenuDropDownGroupType = [
	{
		type: "option",
		label: "workspace.tilemapEditor.contextMenu.cut",
		startIcon: <Scissors />,
		disabled() {
			return true;
		},
        onClick() { },
	},
	{
		type: "option",
		label: "workspace.tilemapEditor.contextMenu.copy",
		startIcon: <Copy />,
		disabled() {
			return true;
		},
        onClick() { },
	},
	{
		type: "option",
		label: "workspace.tilemapEditor.contextMenu.paste",
		startIcon: <ClipboardPaste />,
		disabled() {
			return true;
		},
        onClick() { },
	},
];

const SnappingGroup: MenuDropDownGroupType = [
	{
		type: "subMenu",
		label: "Snapping",
		startIcon: <Grid3x3 className="stroke-1" />,
        subMenusClassName: "w-60",
		subMenus: [
			[
				{
					type: "radio",
					label: "Snapping",
					value: () => "Pixel",
					onValueChange(value) {},
					items: [
						{
							label: "No Snapping",
							value: "None",
						},
						{
							label: "Snap to Grid",
							value: "Grid",
						},
						{
							label: "Snap to Fine Grid",
							value: "FineGrid",
						},
						{
							label: "Snap to Pixel",
							value: "Pixel",
						},
					],
				},
			],
		],
	},
];

const BrushGroup: MenuDropDownGroupType = [
	{
		type: "subMenu",
		label: "workspace.tilemapEditor.contextMenu.currentTool",
		startIcon: <Brush className="stroke-1" />,
        subMenusClassName: "w-60",
		subMenus: [
			[
				{
					type: "radio",
					label: "workspace.tilemapEditor.contextMenu.currentTool",
					value: () => appKernel.toolManager.getCurrentToolId()!,
					onValueChange(value) {
						appKernel.toolManager.startTool(value);
					},
					items: [
						{
							label: "workspace.tool.stamp.label",
							value: "tool.stamp",
                            startIcon: <Stamp className="stroke-1" />,
						},
                        {
                            label: "workspace.tool.eraser.label",
                            value: "tool.eraser",
                            startIcon: <Eraser className="stroke-1" />,
                        },
					],
				},
			],
		],
	},
];

const GridGroup: MenuDropDownGroupType = [
    {
        type: "check",
        label: "workspace.tilemapEditor.contextMenu.showGrid",
        startIcon: <Grid3x3 className="stroke-1" />,
        checked() {
            const activeTilemapView = appKernel.editorFacade.getActiveTilemapView();
            if (!activeTilemapView) return false;
            return activeTilemapView.grid.gridEnabled
        },
        toggle() {
            const activeTilemapView = appKernel.editorFacade.getActiveTilemapView();
            if (!activeTilemapView) return;
            return activeTilemapView.toggleGrid();
        },
    }
];

const DeleteGroup: MenuDropDownGroupType = [
    {
        type: "option",
        label: "workspace.tilemapEditor.contextMenu.delete",
        startIcon: <Trash2 />,
        variant: "destructive",
		disabled: () => {
			const editorFacade = appKernel.editorFacade;
			const currentTilemapSession = editorFacade.getActiveTilemapSession();
			if (!currentTilemapSession) return true;
			return false;
		},
        onClick: () => {
            const editorFacade = appKernel.editorFacade;
			const currentTilemapSession = editorFacade.getActiveTilemapSession();
			if (!currentTilemapSession) return;
			TilemapService.deleteTilemap(currentTilemapSession.tilemap.id);
        }
    },
];

export const TilemapEditorContextMenu: MenuItemType = {
	label: "Edit",
	className: "w-60",
	groups: [BrushGroup, UndoRedoGroup, GridGroup, ActionGroup, DeleteGroup],
};
