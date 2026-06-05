import { CaseSensitive, Eye, Grid3x3, Info, Lock, RectangleHorizontal, RotateCcw, Scan, Search, TriangleAlert, ZoomIn, ZoomOut } from "lucide-react";

import { getSetting, toggleSetting, updateSetting } from "@/application/actions/setting.actions";
import { ShowEntityName, Snapping } from "@/application/settings/setting.enum";
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
					checked: () => getSetting("general.layout.properties"),
					toggle: () => toggleSetting("general.layout.properties")
				},
				{
					type: "check",
					label: "menu.view.action.layout.layers",
					checked: () => getSetting("general.layout.layers"),
					toggle: () => toggleSetting("general.layout.layers")
				},
				{
					type: "check",
					label: "menu.view.action.layout.entities",
					checked: () => getSetting("general.layout.entities"),
					toggle: () => toggleSetting("general.layout.entities")
				},
				{
					type: "check",
					label: "menu.view.action.layout.tilesets",
					checked: () => getSetting("general.layout.tilesets"),
					toggle: () => toggleSetting("general.layout.tilesets")
				},
				{
					type: "check",
					label: "menu.view.action.layout.rulesets",
					checked: () => getSetting("general.layout.rulesets"),
					toggle: () => toggleSetting("general.layout.rulesets")
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
		checked: () => getSetting("general.view.showGrid"),
		toggle: () => toggleSetting("general.view.showGrid")
	},
	{
		type: "check",
		label: "menu.view.action.showTileEntityOutlines",
		checked: () => getSetting("general.view.showEntityOutline"),
		toggle: () => toggleSetting("general.view.showEntityOutline")
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
						return getSetting("general.view.showEntityName")
					},
                    onValueChange: (value: ShowEntityName) => {
						updateSetting("general.view.showEntityName", value)
					},
                    items: [
                        {
                            label: "menu.view.action.showEntityNames.never",
                            value: ShowEntityName.Never,
                        },
                        {
                            label: "menu.view.action.showEntityNames.forSelectedEntities",
                            value: ShowEntityName.ForSelectedEntities,
                        },
                        {
                            label: "menu.view.action.showEntityNames.forAllEntities",
                            value: ShowEntityName.ForAllEntities,
                        },
						{
							label: "menu.view.action.showEntityNames.forHoveredEntities",
							value: ShowEntityName.ForHoveredEntitie,
						}
                    ]
                }
            ]
        ],
	},
	{
		type: "check",
		label: "menu.view.action.showTileAnimations",
		checked: () => getSetting("general.view.showTileAnimations"),
		toggle: () => toggleSetting("general.view.showTileAnimations")
	},
	{
		type: "check",
		label: "menu.view.action.showTileCollisionShapes",
		checked: () => getSetting("general.view.showTileCollisionShapes"),
		toggle: () => toggleSetting("general.view.showTileCollisionShapes")
	},
	{
		type: "check",
		label: "menu.view.action.enableParallax",
		checked: () => getSetting("general.view.enableParallax"),
		toggle: () => toggleSetting("general.view.enableParallax")
	},
	{
		type: "check",
		label: "Highlight Current Layer",
		checked: () => getSetting("general.view.highlightCurrentLayer"),
		toggle: () => toggleSetting("general.view.highlightCurrentLayer")
	},
	{
		type: "check",
		label: "menu.view.action.highlightHoveredEntity",
		checked: () => getSetting("general.view.highlightHoveredEntity"),
		toggle: () => toggleSetting("general.view.highlightHoveredEntity")
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
                    value: () => getSetting("general.view.snapping"),
                    onValueChange: (value: Snapping) => {
						updateSetting("general.view.snapping", value)
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
		disabled: () => true,
		onClick() {},
	},
	{
		type: "option",
		label: "menu.view.action.zoomOut",
        startIcon: <ZoomOut />,
		disabled: () => true,
		onClick() {},
	},
	{
		type: "option",
		label: "menu.view.action.normalSize",
        startIcon: <RectangleHorizontal />,
		disabled: () => true,
		onClick() {},
	},
	{
		type: "option",
		label: "menu.view.action.fitMapInView",
        startIcon: <Scan />,
		disabled: () => true,
		onClick() {},
	},
];

const ViewDropdownOptionGroup5: MenuDropDownGroupType = [
    {
		type: "check",
		label: "menu.view.action.clearView",
		checked: () => false,
		disabled: () => true,
		toggle: () => {

        },
	},
];

export const ViewDropdownOptions: MenuItemType = {
	label: "menu.view.label",
	className: "w-110",
	groups: [ViewDropdownOptionGroup1, ViewDropdownOptionGroup2, ViewDropdownOptionGroup3, ViewDropdownOptionGroup4, ViewDropdownOptionGroup5],
};
