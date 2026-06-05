import { canExecuteCommand, executeCommand } from "@/application/actions/command.actions";
import { ClipboardPaste, Copy, Redo, Scissors, SquareDashed, SquareDashedMousePointer, SquareMousePointer, Trash2, Undo, UserRoundCog } from "lucide-react";

const EditDropdownOptionGroup1: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.edit.action.undo",
		startIcon: <Undo />,
		disabled: () => !canExecuteCommand("workspace.tilemap.undo"),
		onClick: () => executeCommand("workspace.tilemap.undo")
	},
	{
		type: "option",
		label: "menu.edit.action.redo",
		startIcon: <Redo />,
		disabled: () => !canExecuteCommand("workspace.tilemap.redo"),
		onClick: () => executeCommand("workspace.tilemap.redo")
	},
];

const EditDropdownOptionGroup2: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.edit.action.cut",
		startIcon: <Scissors />,
		disabled: () => true,
		onClick() { },
	},
	{
		type: "option",
		label: "menu.edit.action.copy",
		startIcon: <Copy />,
		disabled: () => true,
		onClick() { },
	},
	{
		type: "option",
		label: "menu.edit.action.paste",
		startIcon: <ClipboardPaste />,
		disabled: () => true,
		onClick() { },
	},
	{
		type: "option",
		label: "menu.edit.action.delete",
		startIcon: <Trash2 />,
		disabled: () => true,
		onClick() { },
	},
];

const EditDropdownOptionGroup3: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.edit.action.selectAll",
		startIcon: <SquareMousePointer />,
		disabled: () => true,
		onClick() { },
	},
	{
		type: "option",
		label: "menu.edit.action.invertSelection",
		startIcon: <SquareDashedMousePointer />,
		disabled: () => true,
		onClick() { },
	},
	{
		type: "option",
		label: "menu.edit.action.selectNone",
		startIcon: <SquareDashed />,
		disabled: () => true,
		onClick() { },
	},
];

const EditDropdownOptionGroup4: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.edit.action.settings",
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
