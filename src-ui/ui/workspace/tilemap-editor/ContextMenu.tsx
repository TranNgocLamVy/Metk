import { Brush, ClipboardPaste, Copy, Eraser, Grid3x3, Info, Plus, Redo, Scissors, Stamp, Trash2, Undo } from "lucide-react";

import * as TilemapActions from "@/application/actions/tilemap.actions";
import { appKernel } from "@/application/bootstrap/app-kernel";
import { SETTING_KEYS } from "@/application/settings/setting.enum";
import { usePropertyStore } from "@/ui/stores/property.store";

const settings = appKernel.settings;

const ActionGroup: MenuDropDownGroupType = [
    {
        type: "option",
        label: "workspace.tilemapEditor.contextMenu.new",
        startIcon: <Plus className="stroke-1" />,
        onClick() {
            TilemapActions.createTilemap();
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
			return !editorFacade.getCurrentEditorSession()?.historyManager.canUndo;
		},
		onClick() {
			const editorFacade = appKernel.editorFacade;
			const session = editorFacade.getCurrentEditorSession();
			session?.historyManager.undo(session);
		},
	},
	{
		type: "option",
		label: "workspace.tilemapEditor.contextMenu.redo",
		startIcon: <Redo />,
		disabled() {
			const editorFacade = appKernel.editorFacade;
			return !editorFacade.getCurrentEditorSession()?.historyManager.canRedo;
		},
		onClick() {
			const editorFacade = appKernel.editorFacade;
			const session = editorFacade.getCurrentEditorSession();
			session?.historyManager.redo(session);
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
		label: "menu.view.action.snapping.label",
		startIcon: <Grid3x3 className="stroke-1" />,
        subMenusClassName: "w-60",
		subMenus: [
			[
				{
					type: "radio",
					label: "menu.view.action.snapping.label",
					value: () => "Pixel",
					onValueChange(value) {},
					items: [
						{
							label: "menu.view.action.snapping.noSnapping",
							value: "None",
						},
						{
							label: "menu.view.action.snapping.snapToGrid",
							value: "Grid",
						},
						{
							label: "menu.view.action.snapping.snapToFineGrid",
							value: "FineGrid",
						},
						{
							label: "menu.view.action.snapping.snapToPixel",
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
					value: () => appKernel.toolManager.getCurrentFamilyId()!,
					onValueChange(value) {
						appKernel.toolManager.startToolFamily(value);
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
        checked: () => settings.get(SETTING_KEYS.View.ShowGrid),
		toggle: () => settings.update(SETTING_KEYS.View.ShowGrid, !settings.get(SETTING_KEYS.View.ShowGrid))
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
			TilemapActions.deleteTilemapFile(currentTilemapSession.tilemap.id);
        }
    },
];

export const TilemapEditorContextMenu: MenuItemType = {
	label: "workspace.tilemapEditor.contextMenu.label",
	className: "w-60",
	groups: [BrushGroup, UndoRedoGroup, GridGroup, ActionGroup, DeleteGroup],
};
