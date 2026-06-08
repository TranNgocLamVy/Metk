import { BrushCleaning, FileClock, FolderClock, FolderOpen, FolderOpenDot, FolderPlus, FolderUp, FolderX, Grid2x2Plus, ImageUp, LayoutTemplate, LogOut, Save, SaveAll, SquarePlus, SquareX, X } from "lucide-react";

import { executeCommand } from "@/application/actions/command.actions";
import * as ProjectActions from "@/application/actions/project.actions";
import * as ExampleProjectActions from "@/application/templates/example-project.actions";
import * as RulesetActions from "@/application/actions/ruleset.actions";
import * as TilemapActions from "@/application/actions/tilemap.actions";
import * as TilesetActions from "@/application/actions/tileset.actions";
import { appKernel } from "@/application/bootstrap/app-kernel";
import { SYSTEM_COMMAND_IDS } from "@/application/command-system/command-ids";

const FileDropdownOptionGroup1: MenuDropDownGroupType = [
	{
		type: "subMenu",
		label: "menu.file.action.new.label",
		startIcon: <FolderPlus className=" stroke-2" />,
		subMenus: [
			[
				{
					type: "option",
					label: "menu.file.action.new.emptyProject",
					startIcon: <FolderPlus />,
                    onClick() {
                        ProjectActions.createProject();
                    },
				},
			],
			[
				{
					type: "option",
					label: "menu.file.action.new.tilemap",
					startIcon: <SquarePlus />,
					disabled: () => !(appKernel.projectManager.currentProject != null),
                    onClick() {
						TilemapActions.createTilemap();
					},
				},
				{
					type: "option",
					label: "menu.file.action.new.tileset",
					startIcon: <Grid2x2Plus />,
					disabled: () => !(appKernel.projectManager.currentProject != null),
                    onClick() {
						TilesetActions.createTileset();
					},
				},
				{
					type: "option",
					label: "menu.file.action.new.ruleset",
					startIcon: <Grid2x2Plus />,
					disabled: () => !(appKernel.projectManager.currentProject != null),
                    onClick() {
						RulesetActions.createRuleset();
					},
				},
			],
			[
				{
					type: "option",
					label: "menu.file.action.new.exampleProject",
					startIcon: <LayoutTemplate />,
                    onClick() {
                        ExampleProjectActions.createExampleProject();
                    },
				},
			],
		],
	},
	{
		type: "option",
		label: "menu.file.action.open.file",
		startIcon: <FolderOpen />,
		disabled: () => !(appKernel.projectManager.currentProject != null),
        onClick: () => executeCommand(SYSTEM_COMMAND_IDS.OpenFile)
	},
	{
		type: "option",
		label: "menu.file.action.open.project",
		startIcon: <FolderOpenDot />,
		disabled: () => true,
        onClick() {
			// TODO: Implement open project
		},
	},
	{
		type: "subMenu",
		label: "menu.file.action.recentFiles.label",
		startIcon: <FileClock className=" stroke-2" />,
		subMenus: [
			[
				{
					type: "option",
					label: "menu.file.action.recentFiles.clear",
					startIcon: <BrushCleaning />,
					disabled: () => true,
                    onClick() { },
				},
			],
		],
	},
	{
		type: "subMenu",
		label: "menu.file.action.recentProjects.label",
		startIcon: <FolderClock className=" stroke-2" />,
		subMenus: [
			[
				{
					type: "option",
					label: "menu.file.action.recentProjects.clear",
					startIcon: <BrushCleaning />,
					disabled: () => true,
                    onClick() { },
				},
			],
		],
	},
];

const FileDropdownOptionGroup2: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.file.action.save",
		startIcon: <Save />,
		disabled: () => {
			const editorFacade = appKernel.editorFacade;
			const currentSession = editorFacade.getActiveTilemapSession();
			if (!currentSession) return true;
			return !currentSession.isDirty;
		},
        onClick: () => executeCommand(SYSTEM_COMMAND_IDS.TilemapSave),
	},
	{
		type: "option",
		label: "menu.file.action.saveAs",
		startIcon: <Save />,
		disabled: () => true,
        onClick() { },
	},
	{
		type: "option",
		label: "menu.file.action.saveAll",
		startIcon: <SaveAll />,
		disabled: () => {
			const currentWorkspace = appKernel.workspaceManager.currentWorkspace;
			if (!currentWorkspace) return true;
			const tilemapsSession = currentWorkspace.tilemapSessionManager.tilemapsSession;
			return !tilemapsSession.some(s => s.isDirty);
		},
        onClick: () => executeCommand(SYSTEM_COMMAND_IDS.TilemapSaveAll),
	},
	{
		type: "subMenu",
		label: "menu.file.action.import.label",
		startIcon: <FolderUp className=" stroke-2" />,
		subMenus: [
			[
				{
					type: "option",
					label: "menu.file.action.import.tilemap",
					startIcon: <FolderUp />,
					disabled: () => true,
                    onClick() { },
				},
				{
					type: "option",
					label: "menu.file.action.import.tileset",
					startIcon: <ImageUp />,
					disabled: () => true,
                    onClick() { },
				},
				{
					type: "option",
					label: "menu.file.action.import.ruleset",
					startIcon: <ImageUp />,
					disabled: () => true,
                    onClick() { },
				}
			],
		],
	},
	{
		type: "subMenu",
		label: "menu.file.action.export.label",
		startIcon: <FolderUp className=" stroke-2" />,
		subMenus: [
			[
				{
					type: "option",
					label: "menu.file.action.export.exportTMX",
					startIcon: <FolderUp />,
					disabled: () => {
						const editorFacade = appKernel.editorFacade;
						const currentSession = editorFacade.getActiveTilemapSession();
						if (!currentSession) return true;
						return !currentSession.isDirty;
					},
                    onClick() {
						executeCommand(SYSTEM_COMMAND_IDS.TilemapExportTmx);
					},
				},
				{
					type: "option",
					label: "menu.file.action.export.exportImage",
					startIcon: <ImageUp />,
					disabled: () => true,
                    onClick() { },
				},
			],
		],
	},
];

const FileDropdownOptionGroup4: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.file.action.close",
		startIcon: <X />,
		disabled: () => true,
        onClick() { },
	},
	{
		type: "option",
		label: "menu.file.action.closeAll",
		startIcon: <SquareX />,
		disabled: () => true,
        onClick() { },
	},
	{
		type: "option",
		label: "menu.file.action.closeProject",
		startIcon: <FolderX />,
		disabled: () => true,
        onClick() { },
	},
	{
		type: "option",
		label: "menu.file.action.quit",
		startIcon: <LogOut />,
		disabled: () => true,
        onClick() { },
	},
];

export const FileDropdownOptions: MenuItemType = {
	label: "menu.file.label",
    className: "w-100",
	groups: [FileDropdownOptionGroup1, FileDropdownOptionGroup2, FileDropdownOptionGroup4],
};
