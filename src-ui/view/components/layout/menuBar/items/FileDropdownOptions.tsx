import { BrushCleaning, Command, FileClock, FolderClock, FolderOpen, FolderOpenDot, FolderPlus, FolderUp, FolderX, Grid2x2Plus, ImageUp, LogOut, PenLine, Save, SaveAll, SquareArrowOutUpRight, SquarePlus, SquareX, X } from "lucide-react";

import { Appcore } from "@/core/appcore";

const FileDropdownOptionGroup1: MenuDropDownGroupType = [
	{
		type: "subMenu",
		name: "New",
		startIcon: <FolderPlus className=" stroke-1" />,
		subMenus: [
			[
				{
					type: "option",
					name: "New Project",
					startIcon: <FolderPlus />,
                    onClick() {
                        Appcore.getInstance().projectManager.createProject();
                    },
				},
			],
			[
				{
					type: "option",
					name: "New Map",
					startIcon: <SquarePlus />,
                    onClick() { },
				},
				{
					type: "option",
					name: "New Tileset",
					startIcon: <Grid2x2Plus />,
                    onClick() { },
				},
			],
		],
	},
	{
		type: "option",
		name: "Open File / Project",
		startIcon: <FolderOpen />,
        onClick() { },
	},
	{
		type: "option",
		name: "Open File in Project",
		startIcon: <FolderOpenDot />,
        onClick() { },
	},
	{
		type: "subMenu",
		name: "Recent Files",
		startIcon: <FileClock className=" stroke-1" />,
		subMenus: [
			[
				{
					type: "option",
					name: "Reopen Closed File",
					startIcon: <SquareArrowOutUpRight />,
                    onClick() { },
				},
			],
			[
				{
					type: "option",
					name: "Clear Recent Files",
					startIcon: <BrushCleaning />,
                    onClick() { },
				},
			],
		],
	},
	{
		type: "subMenu",
		name: "Recent Project",
		startIcon: <FolderClock className=" stroke-1" />,
		subMenus: [
			[
				{
					type: "option",
					name: "Clear Recent Projects",
					startIcon: <BrushCleaning />,
                    onClick() { },
				},
			],
		],
	},
];

const FileDropdownOptionGroup2: MenuDropDownGroupType = [
	{
		type: "option",
		name: "Save",
		startIcon: <Save />,
        onClick() { },
	},
	{
		type: "option",
		name: "Save As",
		startIcon: <Save />,
        onClick() { },
	},
	{
		type: "option",
		name: "Save All",
		startIcon: <SaveAll />,
        onClick() { },
	},
	{
		type: "option",
		name: "Export",
		startIcon: <FolderUp />,
        onClick() { },
	},
	{
		type: "option",
		name: "Export as",
		startIcon: <FolderUp />,
        onClick() { },
	},
	{
		type: "option",
		name: "Export as Image",
		startIcon: <ImageUp />,
        onClick() { },
	},
];

const FileDropdownOptionGroup3: MenuDropDownGroupType = [
	{
		type: "subMenu",
		name: "Command",
		startIcon: <Command className=" stroke-[1.25]" />,
		subMenus: [
			[
				{
					type: "option",
					name: "Edit Command",
					startIcon: <PenLine />,
                    onClick() { },
				},
			],
		],
	},
];

const FileDropdownOptionGroup4: MenuDropDownGroupType = [
	{
		type: "option",
		name: "Close",
		startIcon: <X />,
        onClick() { },
	},
	{
		type: "option",
		name: "Close All",
		startIcon: <SquareX />,
        onClick() { },
	},
	{
		type: "option",
		name: "Close Project",
		startIcon: <FolderX />,
        onClick() { },
	},
	{
		type: "option",
		name: "Quit",
		startIcon: <LogOut />,
        onClick() { },
	},
];

export const FileDropdownOptions: MenuItemType = {
	name: "File",
    className: "w-100",
	groups: [FileDropdownOptionGroup1, FileDropdownOptionGroup2, FileDropdownOptionGroup3, FileDropdownOptionGroup4],
};
