import { appCore } from "@/core/appcore";
import { MenuBarUtils } from "@/shared/utils/menuBarUtils";
import { ClipboardPaste, Copy, Redo, Scissors, SquareDashed, SquareDashedMousePointer, SquareMousePointer, Trash2, Undo, UserRoundCog } from "lucide-react";

const EditDropdownOptionGroup1: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.edit.actions.undo",
		startIcon: <Undo />,
		disabled: () =>!MenuBarUtils.canUndo(),
        onClick() {
			const editorContext = appCore.editorContext;
			editorContext.getCurrentHistoryManager()?.undo(editorContext);
		},
	},
	{
		type: "option",
		label: "menu.edit.actions.redo",
		startIcon: <Redo />,
		disabled: () => !MenuBarUtils.canRedo(),
        onClick() {
			const editorContext = appCore.editorContext;
			editorContext.getCurrentHistoryManager()?.redo(editorContext);
		},
	},
];

const EditDropdownOptionGroup2: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.edit.actions.cut",
		startIcon: <Scissors />,
		disabled: () => true,
        onClick() { },
	},
	{
		type: "option",
		label: "menu.edit.actions.copy",
		startIcon: <Copy />,
		disabled: () => true,
        onClick() { },
	},
	{
		type: "option",
		label: "menu.edit.actions.paste",
		startIcon: <ClipboardPaste />,
		disabled: () => true,
        onClick() { },
	},
	{
		type: "option",
		label: "menu.edit.actions.delete",
		startIcon: <Trash2 />,
		disabled: () => true,
        onClick() { },
	},
];

const EditDropdownOptionGroup3: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.edit.actions.selectAll",
		startIcon: <SquareMousePointer />,
		disabled: () => true,
        onClick() { },
	},
	{
		type: "option",
		label: "menu.edit.actions.invertSelection",
		startIcon: <SquareDashedMousePointer />,
		disabled: () => true,
        onClick() { },
	},
	{
		type: "option",
		label: "menu.edit.actions.selectNone",
		startIcon: <SquareDashed />,
		disabled: () => true,
        onClick() { },
	},
];

const EditDropdownOptionGroup4: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.edit.actions.settings",
		startIcon: <UserRoundCog />,
		disabled: () => true,
        onClick() { },
	},
];

export const EditDropdownOptions: MenuItemType = {
	label: "menu.edit.label",
	className: "w-100",
	groups: [EditDropdownOptionGroup1, EditDropdownOptionGroup2, EditDropdownOptionGroup3, EditDropdownOptionGroup4],
};
