import { CaseSensitive, Eye, Grid3x3, Lock, RectangleHorizontal, RotateCcw, Scan, Search, ZoomIn, ZoomOut } from "lucide-react";

import { useConsoleStore } from "@/ui/stores/console.store";

type ShowObjectNamesTypes = "Never" | "ForSelectedObjects" | "ForAllObjects";
type SnappingModeTypes = "None" | "Grid" | "FineGrid" | "Pixel";

const noop = () => {};

const uiViewDefaults = {
	showProject: false,
	showIssues: false,
	showProperties: false,
	showLayers: false,
	showHistory: false,
	showObjects: false,
	showTemplateEditor: false,
	showTilesets: false,
	showTerrainSets: false,
	showMinimap: false,
	showTileStamps: false,
	showMainToolbar: false,
	showTools: false,
	showToolOptions: false,
} as const;

const drawingViewDefaults = {
	showGrid: true,
	showTileObjectOutlines: false,
	showObjectReferences: false,
	showObjectNames: "ForAllObjects" as ShowObjectNamesTypes,
	showNamesForHoveredObjects: false,
	showTileAnimations: false,
	showTileCollisionShapes: false,
	showWorld: false,
	enableParallax: false,
	highlightCurrentLayer: false,
	highlightHoveredObject: false,
	snappingMode: "None" as SnappingModeTypes,
} as const;

const ViewDropdownOptionGroup1: MenuDropDownGroupType = [
	{
		type: "subMenu",
		label: "menu.view.action.viewAndToolbars.label",
        startIcon: <Eye className="stroke-1" />,
		subMenus: [
			[
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.project",
					checked: () => uiViewDefaults.showProject,
					disabled: () => true,
					toggle: noop,
				},
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.console",
					checked: () => useConsoleStore().isConsoleOpen,
					toggle: () => useConsoleStore.getState().toggleConsole(),
				},
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.issues",
					checked: () => uiViewDefaults.showIssues,
					disabled: () => true,
					toggle: noop,
				},
			],
			[
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.properties",
					checked: () => uiViewDefaults.showProperties,
					disabled: () => true,
					toggle: noop,
				},
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.layer",
					checked: () => uiViewDefaults.showLayers,
					disabled: () => true,
					toggle: noop,
				},
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.history",
					checked: () => uiViewDefaults.showHistory,
					disabled: () => true,
					toggle: noop,
				},
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.objects",
					checked: () => uiViewDefaults.showObjects,
					disabled: () => true,
					toggle: noop,
				},
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.templateEditor",
					checked: () => uiViewDefaults.showTemplateEditor,
					disabled: () => true,
					toggle: noop,
				},
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.tilesets",
					checked: () => uiViewDefaults.showTilesets,
					disabled: () => true,
					toggle: noop,
				},
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.terrainSets",
					checked: () => uiViewDefaults.showTerrainSets,
					disabled: () => true,
					toggle: noop,
				},
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.minimap",
					checked: () => uiViewDefaults.showMinimap,
					disabled: () => true,
					toggle: noop,
				},
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.tileStamps",
					checked: () => uiViewDefaults.showTileStamps,
					disabled: () => true,
					toggle: noop,
				},
			],
			[
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.mainToolbar",
					checked: () => uiViewDefaults.showMainToolbar,
					disabled: () => true,
					toggle: noop,
				},
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.tools",
					checked: () => uiViewDefaults.showTools,
					disabled: () => true,
					toggle: noop,
				},
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.toolOptions",
					checked: () => uiViewDefaults.showToolOptions,
					disabled: () => true,
					toggle: noop,
				},
			],
			[
				{
					type: "option",
					label: "menu.view.action.viewAndToolbars.lockLayout",
                    startIcon: <Lock />,
					disabled: () => true,
					onClick() {},
				},
				{
					type: "option",
					label: "menu.view.action.viewAndToolbars.resetToDefaultLayout",
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
		checked: () => drawingViewDefaults.showGrid,
		disabled: () => true,
		toggle: noop,
	},
	{
		type: "check",
		label: "Show Tile Object Outlines",
		checked: () => drawingViewDefaults.showTileObjectOutlines,
		disabled: () => true,
		toggle: noop,
	},
	{
		type: "check",
		label: "menu.view.action.showObjectReferences",
		checked: () => drawingViewDefaults.showObjectReferences,
		disabled: () => true,
		toggle: noop,
	},
	{
		type: "subMenu",
		label: "menu.view.action.showObjectNames.label",
        startIcon: <CaseSensitive />,
		subMenus: [
            [
                {
                    type: "radio",
                    label: "menu.view.action.showObjectNames.never",
                    value: () => drawingViewDefaults.showObjectNames,
					disabled: () => true,
                    onValueChange: () => {},
                    items: [
                        {
                            label: "menu.view.action.showObjectNames.never",
                            value: "Never",
                        },
                        {
                            label: "menu.view.action.showObjectNames.forSelectedObjects",
                            value: "ForSelectedObjects",
                        },
                        {
                            label: "menu.view.action.showObjectNames.forAllObjects",
                            value: "ForAllObjects",
                        },
                    ]
                }
            ],
            [
                {
                    type: "check",
                    label: "menu.view.action.showObjectNames.forHoveredObjects",
                    checked: () => drawingViewDefaults.showNamesForHoveredObjects,
					disabled: () => true,
                    toggle: noop,
                }
            ]
        ],
	},
	{
		type: "check",
		label: "menu.view.action.showTileAnimations",
		checked: () => drawingViewDefaults.showTileAnimations,
		disabled: () => true,
		toggle: noop,
	},
	{
		type: "check",
		label: "menu.view.action.showTileCollisionShapes",
		checked: () => drawingViewDefaults.showTileCollisionShapes,
		disabled: () => true,
		toggle: noop,
	},
	{
		type: "check",
		label: "menu.view.action.showWorld",
		checked: () => drawingViewDefaults.showWorld,
		disabled: () => true,
		toggle: noop,
	},
	{
		type: "check",
		label: "menu.view.action.enableParallax",
		checked: () => drawingViewDefaults.enableParallax,
		disabled: () => true,
		toggle: noop,
	},
	{
		type: "check",
		label: "Highlight Current Layer",
		checked: () => drawingViewDefaults.highlightCurrentLayer,
		disabled: () => true,
		toggle: noop,
	},
	{
		type: "check",
		label: "menu.view.action.highlightHoveredObject",
		checked: () => drawingViewDefaults.highlightHoveredObject,
		disabled: () => true,
		toggle: noop,
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
                    value: () => drawingViewDefaults.snappingMode,
					disabled: () => true,
                    onValueChange: () => {},
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
