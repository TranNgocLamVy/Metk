import { CaseSensitive, Eye, Grid3x3, Info, Lock, RectangleHorizontal, RotateCcw, Scan, Search, TriangleAlert, ZoomIn, ZoomOut } from "lucide-react";

import { appKernel } from "@/application/bootstrap/app-kernel";
import { ShowEntityName, Snapping } from "@/application/settings/setting.enum";
import { useConsoleStore } from "@/ui/stores/console.store";


const noop = () => {};

const drawingViewDefaults = {
	showTileObjectOutlines: false,
	showObjectReferences: false,
	showNamesForHoveredObjects: false,
	showTileAnimations: false,
	showTileCollisionShapes: false,
	showWorld: false,
	enableParallax: false,
	highlightCurrentLayer: false,
	highlightHoveredObject: false,
} as const;

const settings = appKernel.settings;

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
					checked: () => settings.get("general.layout.properties"),
					toggle: () => settings.update("general.layout.properties", !settings.get("general.layout.properties"))
				},
				{
					type: "check",
					label: "menu.view.action.layout.layers",
					checked: () => settings.get("general.layout.layers"),
					toggle: () => settings.update("general.layout.layers", !settings.get("general.layout.layers"))
				},
				{
					type: "check",
					label: "menu.view.action.layout.entities",
					checked: () => settings.get("general.layout.entities"),
					toggle: () => settings.update("general.layout.entities", !settings.get("general.layout.entities"))
				},
				{
					type: "check",
					label: "menu.view.action.layout.tilesets",
					checked: () => settings.get("general.layout.tilesets"),
					toggle: () => settings.update("general.layout.tilesets", !settings.get("general.layout.tilesets"))
				},
				{
					type: "check",
					label: "menu.view.action.layout.rulesets",
					checked: () => settings.get("general.layout.rulesets"),
					toggle: () => settings.update("general.layout.rulesets", !settings.get("general.layout.rulesets"))
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
		checked: () => settings.get("general.view.showGrid"),
		toggle: () => settings.update("general.view.showGrid", !settings.get("general.view.showGrid"))
	},
	{
		type: "check",
		label: "menu.view.action.showTileEntityOutlines",
		checked: () => settings.get("general.view.showEntityOutline"),
		toggle: () => settings.update("general.view.showEntityOutline", !settings.get("general.view.showEntityOutline"))
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
						return settings.get("general.view.showEntityName")
					},
                    onValueChange: (value: ShowEntityName) => {
						settings.update("general.view.showEntityName", value)
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
		checked: () => settings.get("general.view.showTileAnimations"),
		toggle: () => settings.update("general.view.showTileAnimations", !settings.get("general.view.showTileAnimations"))
	},
	{
		type: "check",
		label: "menu.view.action.showTileCollisionShapes",
		checked: () => settings.get("general.view.showTileCollisionShapes"),
		toggle: () => settings.update("general.view.showTileCollisionShapes", !settings.get("general.view.showTileCollisionShapes")),
	},
	{
		type: "check",
		label: "menu.view.action.enableParallax",
		checked: () => settings.get("general.view.enableParallax"),
		toggle: () => settings.update("general.view.enableParallax", !settings.get("general.view.enableParallax")),
	},
	{
		type: "check",
		label: "Highlight Current Layer",
		checked: () => settings.get("general.view.highlightCurrentLayer"),
		toggle: () => settings.update("general.view.highlightCurrentLayer", !settings.get("general.view.highlightCurrentLayer"))
	},
	{
		type: "check",
		label: "menu.view.action.highlightHoveredEntity",
		checked: () => settings.get("general.view.highlightHoveredEntity"),
		toggle: () => settings.update("general.view.highlightHoveredEntity", !settings.get("general.view.highlightHoveredEntity"))
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
                    value: () => settings.get("general.view.snapping"),
                    onValueChange: (value: Snapping) => {
						settings.update("general.view.snapping", value)
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
