import { CaseSensitive, Eye, Grid3x3, Info, Lock, RectangleHorizontal, RotateCcw, Scan, Search, TriangleAlert, ZoomIn, ZoomOut } from "lucide-react";

import { canExecuteCommand, executeCommand } from "@/application/actions/command.actions";
import { SYSTEM_COMMAND_IDS } from "@/application/command-system/command-ids";
import { getSetting, toggleSetting, updateSetting } from "@/application/actions/setting.actions";
import { SETTING_KEYS, ShowEntityName, Snapping } from "@/application/settings/setting.enum";
import { useConsoleStore } from "@/ui/stores/console.store";


const noop = () => {};

const ViewDropdownOptionGroup1: MenuDropDownGroupType = [
	{
		type: "subMenu",
		label: "menu.view.action.layout.label",
        startIcon: <Eye className="stroke-1" />,
		subMenus: [
			[
				{
					type: "option",
					label: "menu.view.action.layout.console",
					startIcon: <Info />,
					onClick: () => useConsoleStore.getState().toggleWithType("log"),
				},
				{
					type: "option",
					label: "menu.view.action.layout.issues",
					startIcon: <TriangleAlert />,
					onClick: () => useConsoleStore.getState().toggleWithType("error"),
				},
			],
			[
				{
					type: "check",
					label: "menu.view.action.layout.properties",
					checked: () => getSetting(SETTING_KEYS.Layout.Properties),
					toggle: () => toggleSetting(SETTING_KEYS.Layout.Properties)
				},
				{
					type: "check",
					label: "menu.view.action.layout.layers",
					checked: () => getSetting(SETTING_KEYS.Layout.Layers),
					toggle: () => toggleSetting(SETTING_KEYS.Layout.Layers)
				},
				{
					type: "check",
					label: "menu.view.action.layout.entities",
					checked: () => getSetting(SETTING_KEYS.Layout.Entities),
					toggle: () => toggleSetting(SETTING_KEYS.Layout.Entities)
				},
				{
					type: "check",
					label: "menu.view.action.layout.tilesets",
					checked: () => getSetting(SETTING_KEYS.Layout.Tilesets),
					toggle: () => toggleSetting(SETTING_KEYS.Layout.Tilesets)
				},
				{
					type: "check",
					label: "menu.view.action.layout.rulesets",
					checked: () => getSetting(SETTING_KEYS.Layout.Rulesets),
					toggle: () => toggleSetting(SETTING_KEYS.Layout.Rulesets)
				},
				{
					type: "check",
					label: "menu.view.action.layout.minimap",
					checked: () => false,
					disabled: () => true,
					toggle: noop,
				},
			],
			[
				{
					type: "check",
					label: "menu.view.action.layout.mainToolbar",
					checked: () => false,
					disabled: () => true,
					toggle: noop,
				},
				{
					type: "check",
					label: "menu.view.action.layout.tools",
					checked: () => false,
					disabled: () => true,
					toggle: noop,
				},
				{
					type: "check",
					label: "menu.view.action.layout.toolOptions",
					checked: () => false,
					disabled: () => true,
					toggle: noop,
				},
			],
			[
				{
					type: "option",
					label: "menu.view.action.layout.lockLayout",
                    startIcon: <Lock />,
					disabled: () => true,
					onClick() {},
				},
				{
					type: "option",
					label: "menu.view.action.layout.resetToDefaultLayout",
                    startIcon: <RotateCcw />,
					disabled: () => true,
					onClick() {},
				},
			],
		],
	},
	{
		type: "option",
		label: "menu.view.action.searchActions",
		startIcon: <Search />,
		disabled: () => true,
		onClick() {},
	},
];

const ViewDropdownOptionGroup2: MenuDropDownGroupType = [
	{
		type: "check",
		label: "menu.view.action.showGrid",
		checked: () => getSetting(SETTING_KEYS.View.ShowGrid),
		toggle: () => toggleSetting(SETTING_KEYS.View.ShowGrid)
	},
	{
		type: "check",
		label: "menu.view.action.showEntityOutline",
		checked: () => getSetting(SETTING_KEYS.View.ShowEntityOutline),
		toggle: () => toggleSetting(SETTING_KEYS.View.ShowEntityOutline)
	},
	{
		type: "subMenu",
		label: "menu.view.action.showEntityNames.label",
        startIcon: <CaseSensitive />,
		subMenus: [
            [
                {
                    type: "radio",
                    label: "menu.view.action.showEntityNames.label",
                    value: () => {
						return getSetting(SETTING_KEYS.View.ShowEntityName)
					},
                    onValueChange: (value: ShowEntityName) => {
						updateSetting(SETTING_KEYS.View.ShowEntityName, value)
					},
                    items: [
                        {
                            label: "menu.view.action.showEntityNames.never",
                            value: ShowEntityName.Never,
                        },
                        {
                            label: "menu.view.action.showEntityNames.always",
                            value: ShowEntityName.Always,
                        },
                        {
                            label: "menu.view.action.showEntityNames.selected",
                            value: ShowEntityName.Selected,
							disabled: () => true,
                        },
                        {
                            label: "menu.view.action.showEntityNames.hovered",
                            value: ShowEntityName.Hovered,
							disabled: () => true,
                        },
                    ]
                }
            ]
        ],
	},
	{
		type: "check",
		label: "menu.view.action.showTileAnimations",
		checked: () => getSetting(SETTING_KEYS.View.ShowTileAnimations),
		toggle: () => toggleSetting(SETTING_KEYS.View.ShowTileAnimations),
		disabled: () => true,
	},
	{
		type: "check",
		label: "menu.view.action.showTileCollisionShapes",
		checked: () => getSetting(SETTING_KEYS.View.ShowTileCollisionShapes),
		toggle: () => toggleSetting(SETTING_KEYS.View.ShowTileCollisionShapes),
		disabled: () => true,
	},
	{
		type: "check",
		label: "menu.view.action.enableParallax",
		checked: () => getSetting(SETTING_KEYS.View.EnableParallax),
		toggle: () => toggleSetting(SETTING_KEYS.View.EnableParallax)
	},
	{
		type: "check",
		label: "Highlight Current Layer",
		checked: () => getSetting(SETTING_KEYS.View.HighlightCurrentLayer),
		toggle: () => toggleSetting(SETTING_KEYS.View.HighlightCurrentLayer),
		disabled: () => true,
	},
	{
		type: "check",
		label: "menu.view.action.highlightHoveredEntity",
		checked: () => getSetting(SETTING_KEYS.View.HighlightHoveredEntity),
		toggle: () => toggleSetting(SETTING_KEYS.View.HighlightHoveredEntity),
		disabled: () => true,
	},
];

const ViewDropdownOptionGroup3: MenuDropDownGroupType = [
	{
		type: "subMenu",
		label: "menu.view.action.snapping.label",
        startIcon: <Grid3x3 className="stroke-1" />,
		subMenus: [
            [
                {
                    type: "radio",
                    label: "menu.view.action.snapping.label",
                    value: () => getSetting(SETTING_KEYS.View.Snapping),
					disabled: () => true,
                    onValueChange: (value: Snapping) => {
						updateSetting(SETTING_KEYS.View.Snapping, value)
					},
                    items: [
                        {
                            label: "menu.view.action.snapping.noSnapping",
                            value: Snapping.NoSnap,
                        },
                        {
                            label: "menu.view.action.snapping.snapToGrid",
                            value: Snapping.SnapToGrid,
                        },
                        {
                            label: "menu.view.action.snapping.snapToFineGrid",
                            value: Snapping.SnapToFineGrid,
                        },
                        {
                            label: "menu.view.action.snapping.snapToPixel",
                            value: Snapping.SnapToPixel,
                        },
                    ]
                }
            ]
        ],
	},
];

const ViewDropdownOptionGroup4: MenuDropDownGroupType = [
	{
		type: "option",
		label: "menu.view.action.zoomIn",
        startIcon: <ZoomIn />,
		disabled: () => !canExecuteCommand(SYSTEM_COMMAND_IDS.TilemapViewZoomIn),
		onClick: () => executeCommand(SYSTEM_COMMAND_IDS.TilemapViewZoomIn),
	},
	{
		type: "option",
		label: "menu.view.action.zoomOut",
        startIcon: <ZoomOut />,
		disabled: () => !canExecuteCommand(SYSTEM_COMMAND_IDS.TilemapViewZoomOut),
		onClick: () => executeCommand(SYSTEM_COMMAND_IDS.TilemapViewZoomOut),
	},
	{
		type: "option",
		label: "menu.view.action.normalSize",
        startIcon: <RectangleHorizontal />,
		disabled: () => !canExecuteCommand(SYSTEM_COMMAND_IDS.TilemapViewNormalSize),
		onClick: () => executeCommand(SYSTEM_COMMAND_IDS.TilemapViewNormalSize),
	},
	{
		type: "option",
		label: "menu.view.action.fitMapInView",
        startIcon: <Scan />,
		disabled: () => !canExecuteCommand(SYSTEM_COMMAND_IDS.TilemapViewFitMapInView),
		onClick: () => executeCommand(SYSTEM_COMMAND_IDS.TilemapViewFitMapInView),
	},
];

const ViewDropdownOptionGroup5: MenuDropDownGroupType = [
    {
		type: "check",
		label: "menu.view.action.clearView",
		checked: () => false,
		disabled: () => true,
		toggle: noop
	},
];

export const ViewDropdownOptions: MenuItemType = {
	label: "menu.view.label",
	className: "w-110",
	groups: [ViewDropdownOptionGroup1, ViewDropdownOptionGroup2, ViewDropdownOptionGroup3, ViewDropdownOptionGroup4, ViewDropdownOptionGroup5],
};
