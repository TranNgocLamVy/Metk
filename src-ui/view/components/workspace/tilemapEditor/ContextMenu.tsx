import { Brush, ClipboardPaste, Copy, Eraser, Grid3x3, Pen, Plus, Redo, Scissors, Stamp, Trash2, Undo } from "lucide-react";

import { appCore } from "@/core/appcore";
import { TilemapService } from "@/shared/services/tilemapService";

const ActionGroup: MenuDropDownGroupType = [
    {
        type: "option",
        label: "workspace.tilemapEditor.contextMenu.new",
        startIcon: <Plus className="stroke-1" />,
        onClick() {
            TilemapService.createTilemap();
        }
    },
];

const UndoRedoGroup: MenuDropDownGroupType = [
	{
		type: "option",
		label: "workspace.tilemapEditor.contextMenu.undo",
		startIcon: <Undo />,
		disabled() {
			const editorContext = appCore.editorContext;
			const historyManager = editorContext.getCurrentHistoryManager();
			return !historyManager?.canUndo;
		},
		onClick() {
			const editorContext = appCore.editorContext;
			editorContext.getCurrentHistoryManager()?.undo(editorContext);
		},
	},
	{
		type: "option",
		label: "workspace.tilemapEditor.contextMenu.redo",
		startIcon: <Redo />,
		disabled() {
			const editorContext = appCore.editorContext;
			const historyManager = editorContext.getCurrentHistoryManager();
			return !historyManager?.canRedo;
		},
		onClick() {
			const editorContext = appCore.editorContext;
			editorContext.getCurrentHistoryManager()?.redo(editorContext);
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
					value: () => appCore.toolManager.getCurrentToolId()!,
					onValueChange(value) {
						appCore.toolManager.startTool(value);
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
            const sessionView = appCore.editorContext.getCurrentTilemapSessionView();
            if (!sessionView) return false;
            return sessionView.grid.gridEnabled
        },
        toggle() {
            const sessionView = appCore.editorContext.getCurrentTilemapSessionView();
            if (!sessionView) return;
            return sessionView.toggleGrid();
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
			const editorContext = appCore.editorContext;
			const currentTilemapSession = editorContext.getCurrentTilemapSession();
			if (!currentTilemapSession) return true;
			return false;
		},
        onClick: () => {
            const editorContext = appCore.editorContext;
			const currentTilemapSession = editorContext.getCurrentTilemapSession();
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
