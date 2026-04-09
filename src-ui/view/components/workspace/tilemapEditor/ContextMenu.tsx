import { Brush, ClipboardPaste, Copy, Eraser, Grid3x3, Pen, Plus, Redo, Scissors, Stamp, Trash2, Undo } from "lucide-react";

import { AppCore } from "@/core/appcore";
import { TilemapService } from "@/shared/services/tilemapService";

const ActionGroup: MenuDropDownGroupType = [
    {
        type: "option",
        name: "Create new Tilemap",
        startIcon: <Plus className="stroke-1" />,
        onClick() {
            TilemapService.createTilemap();
        }
    },
];

const UndoRedoGroup: MenuDropDownGroupType = [
	{
		type: "option",
		name: "Undo",
		startIcon: <Undo />,
		disabled() {
			const editorContext = AppCore.getIns().editorContext;
			const historyManager = editorContext.getCurrentHistoryManager();
			return !historyManager?.canUndo;
		},
		onClick() {
			const editorContext = AppCore.getIns().editorContext;
			editorContext.getCurrentHistoryManager()?.undo(editorContext);
		},
	},
	{
		type: "option",
		name: "Redo",
		startIcon: <Redo />,
		disabled() {
			const editorContext = AppCore.getIns().editorContext;
			const historyManager = editorContext.getCurrentHistoryManager();
			return !historyManager?.canRedo;
		},
		onClick() {
			const editorContext = AppCore.getIns().editorContext;
			editorContext.getCurrentHistoryManager()?.redo(editorContext);
		},
	},
];

const EditGroup: MenuDropDownGroupType = [
	{
		type: "option",
		name: "Cut",
		startIcon: <Scissors />,
        onClick() { },
	},
	{
		type: "option",
		name: "Copy",
		startIcon: <Copy />,
        onClick() { },
	},
	{
		type: "option",
		name: "Paste",
		startIcon: <ClipboardPaste />,
        onClick() { },
	},
];

const SnappingGroup: MenuDropDownGroupType = [
	{
		type: "subMenu",
		name: "Snapping",
		startIcon: <Grid3x3 className="stroke-1" />,
        subMenusClassName: "w-60",
		subMenus: [
			[
				{
					type: "radio",
					name: "Snapping",
					value: () => "Pixel",
					onValueChange(value) {},
					items: [
						{
							name: "No Snapping",
							value: "None",
						},
						{
							name: "Snap to Grid",
							value: "Grid",
						},
						{
							name: "Snap to Fine Grid",
							value: "FineGrid",
						},
						{
							name: "Snap to Pixel",
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
		name: "Brush",
		startIcon: <Brush className="stroke-1" />,
        subMenusClassName: "w-60",
		subMenus: [
			[
				{
					type: "radio",
					name: "Brush Types",
					value: () => AppCore.getIns().toolManager.getCurrentToolId()!,
					onValueChange(value) {
						AppCore.getIns().toolManager.startTool(value);
					},
					items: [
						{
							name: "Stamp",
							value: "stamp",
                            startIcon: <Stamp className="stroke-1" />,
						},
                        {
                            name: "Eraser",
                            value: "eraser",
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
        name: "Show Grid",
        startIcon: <Grid3x3 className="stroke-1" />,
        checked() {
            const session = AppCore.getIns().editorContext.getCurrentTilemapSession();
            if (!session) return false;
            return session.sessionView.grid.gridEnabled
        },
        toggle() {
            const session = AppCore.getIns().editorContext.getCurrentTilemapSession();
            if (!session) return;
            session.sessionView.toggleGrid();
        },
    }
];

const DeleteGroup: MenuDropDownGroupType = [
    {
        type: "option",
        name: "Delete Tilemap",
        startIcon: <Trash2 />,
        variant: "destructive",
        onClick() {
            // TODO: Implement
        }
    },
];

export const TilemapEditorContextMenu: MenuItemType = {
	name: "Edit",
	className: "w-60",
	groups: [BrushGroup, UndoRedoGroup, GridGroup, ActionGroup, DeleteGroup],
};
