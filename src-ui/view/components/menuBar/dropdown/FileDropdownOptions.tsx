import { BrushCleaning, FileClock, FolderClock, FolderOpen, FolderOpenDot, FolderPlus, FolderUp, FolderX, Grid2x2Plus, ImageUp, LogOut, PenLine, Save, SaveAll, SquarePlus, SquareX, X } from "lucide-react";

import { ProjectService } from "@/shared/services/projectService";
import { TilemapService } from "@/shared/services/tilemapService";
import { TilesetService } from "@/shared/services/tilesetService";
import { RulesetService } from "@/shared/services/rulesetService";
import { appCore } from "@/core/appcore";
import { DialogZLevel } from "@/shared/types/dialog";
import { useDialogStore } from "@/view/stores/dialogStore";
import { executeCommand } from "@/core/service/commandService";

const FileDropdownOptionGroup1: MenuDropDownGroupType = [
	{
		type: "subMenu",
		label: "menu.file.actions.new.label",
		startIcon: <FolderPlus className=" stroke-2" />,
		subMenus: [
			[
				{
					type: "option",
					label: "menu.file.actions.new.project",
					startIcon: <FolderPlus />,
                    onClick() {
                        ProjectService.createProject();
                    },
				},
			],
			[
				{
					type: "option",
					label: "menu.file.actions.new.tilemap",
					startIcon: <SquarePlus />,
					disabled: () => !(appCore.projectManager.currentProject != null),
                    onClick() {
						TilemapService.createTilemap();
					},
				},
				{
					type: "option",
					label: "menu.file.actions.new.tileset",
					startIcon: <Grid2x2Plus />,
					disabled: () => !(appCore.projectManager.currentProject != null),
                    onClick() {
						TilesetService.createTileset();
					},
				},
				{
					type: "option",
					label: "menu.file.actions.new.ruleset",
					startIcon: <Grid2x2Plus />,
					disabled: () => !(appCore.projectManager.currentProject != null),
                    onClick() {
						RulesetService.createRuleset();
					},
				},
			],
		],
	},
	{
		type: "option",
		label: "menu.file.actions.open.file",
		startIcon: <FolderOpen />,
		disabled: () => !(appCore.projectManager.currentProject != null),
        onClick: () => executeCommand("workspace.openFile")
	},
	{
		type: "option",
		label: "menu.file.actions.open.project",
		startIcon: <FolderOpenDot />,
		disabled: () => true,
        onClick() {
			// TODO: Implement open project
		},
	},
	{
		type: "subMenu",
		label: "menu.file.actions.recentFiles.label",
		startIcon: <FileClock className=" stroke-2" />,
		subMenus: [
			[
				{
					type: "option",
					label: "menu.file.actions.recentFiles.clear",
					startIcon: <BrushCleaning />,
					disabled: () => true,
                    onClick() { },
				},
			],
		],
	},
	{
		type: "subMenu",
		label: "menu.file.actions.recentProjects.label",
		startIcon: <FolderClock className=" stroke-2" />,
		subMenus: [
			[
				{
					type: "option",
					label: "menu.file.actions.recentProjects.clear",
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
		label: "menu.file.actions.save",
		startIcon: <Save />,
		disabled: () => {
			const editorContext = appCore.editorContext;
			const currentSession = editorContext.getCurrentTilemapSession();
			if (!currentSession) return true;
			return !currentSession.isDirty;
		},
        onClick: () => executeCommand("workspace.tilemap.save"),
	},
	{
		type: "option",
		label: "menu.file.actions.saveAs",
		startIcon: <Save />,
		disabled: () => true,
        onClick() { },
	},
	{
		type: "option",
		label: "menu.file.actions.saveAll",
		startIcon: <SaveAll />,
		disabled: () => {
			const currentWorkspace = appCore.workspaceManager.currentWorkspace;
			if (!currentWorkspace) return true;
			const tilemapsSession = currentWorkspace.tilemapSessionManager.tilemapsSession;
			return !tilemapsSession.some(s => s.isDirty);
		},
        onClick: () => executeCommand("workspace.tilemap.saveAll"),
	},
	{
		type: "subMenu",
		label: "menu.file.actions.import.label",
		startIcon: <FolderUp className=" stroke-2" />,
		subMenus: [
			[
				{
					type: "option",
					label: "menu.file.actions.import.tilemap",
					startIcon: <FolderUp />,
					disabled: () => true,
                    onClick() { },
				},
				{
					type: "option",
					label: "menu.file.actions.import.tileset",
					startIcon: <ImageUp />,
					disabled: () => true,
                    onClick() { },
				},
				{
					type: "option",
					label: "menu.file.actions.import.ruleset",
					startIcon: <ImageUp />,
					disabled: () => true,
                    onClick() { },
				}
			],
		],
	},
	{
		type: "subMenu",
		label: "menu.file.actions.export.label",
		startIcon: <FolderUp className=" stroke-2" />,
		subMenus: [
			[
				{
					type: "option",
					label: "menu.file.actions.export.exportTMX",
					startIcon: <FolderUp />,
					disabled: () => {
						const editorContext = appCore.editorContext;
						const currentSession = editorContext.getCurrentTilemapSession();
						if (!currentSession) return true;
						return !currentSession.isDirty;
					},
                    onClick() {
						executeCommand("workspace.tilemap.export.tmx");
					},
				},
				{
					type: "option",
					label: "menu.file.actions.export.exportImage",
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
		label: "menu.file.actions.close",
		startIcon: <X />,
		disabled: () => true,
        onClick() { },
	},
	{
		type: "option",
		label: "menu.file.actions.closeAll",
		startIcon: <SquareX />,
		disabled: () => true,
        onClick() { },
	},
	{
		type: "option",
		label: "menu.file.actions.closeProject",
		startIcon: <FolderX />,
		disabled: () => true,
        onClick() { },
	},
	{
		type: "option",
		label: "menu.file.actions.quit",
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
