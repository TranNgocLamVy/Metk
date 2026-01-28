import { ClipboardPaste, Copy, Redo, Scissors, SquareDashed, SquareDashedMousePointer, SquareMousePointer, Trash2, Undo, UserRoundCog } from "lucide-react";

const EditDropdownOptionGroup1: MenuDropDownGroupType = [
	{
		type: "option",
		name: "Undo",
		startIcon: <Undo />,
        onClick() { },
	},
	{
		type: "option",
		name: "Redo",
		startIcon: <Redo />,
        onClick() { },
	},
];

const EditDropdownOptionGroup2: MenuDropDownGroupType = [
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
	{
		type: "option",
		name: "Paste in Place",
		startIcon: <ClipboardPaste />,
        onClick() { },
	},
	{
		type: "option",
		name: "Delete",
		startIcon: <Trash2 />,
        onClick() { },
	},
];

const EditDropdownOptionGroup3: MenuDropDownGroupType = [
	{
		type: "option",
		name: "Select All",
		startIcon: <SquareMousePointer />,
        onClick() { },
	},
	{
		type: "option",
		name: "Invert Selection",
		startIcon: <SquareDashedMousePointer />,
        onClick() { },
	},
	{
		type: "option",
		name: "Select None",
		startIcon: <SquareDashed />,
        onClick() { },
	},
];

const EditDropdownOptionGroup4: MenuDropDownGroupType = [
	{
		type: "option",
		name: "Preferences",
		startIcon: <UserRoundCog />,
        onClick() { },
	},
];

export const EditDropdownOptions: MenuItemType = {
	name: "menuBar.edit",
	className: "w-100",
	groups: [EditDropdownOptionGroup1, EditDropdownOptionGroup2, EditDropdownOptionGroup3, EditDropdownOptionGroup4],
};
