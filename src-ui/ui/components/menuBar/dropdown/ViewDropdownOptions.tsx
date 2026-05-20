import { CaseSensitive, Eye, Grid3x3, Lock, RectangleHorizontal, RotateCcw, Scan, Search, ZoomIn, ZoomOut } from "lucide-react";

import { ShowObjectNamesTypes, SnappingModeTypes, useDrawingViewOptions } from "@/ui/stores/drawing-view.store";
import { useUIViewOptions } from "@/ui/stores/ui-view.store";
import { useConsoleStore } from "@/ui/stores/console.store";

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
					checked: () => useUIViewOptions().showProject,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowProject(),
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
					checked: () => useUIViewOptions().showIssues,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowIssues(),
				},
			],
			[
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.properties",
					checked: () => useUIViewOptions().showProperties,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowProperties(),
				},
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.layer",
					checked: () => useUIViewOptions().showLayers,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowLayers(),
				},
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.history",
					checked: () => useUIViewOptions().showHistory,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowHistory(),
				},
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.objects",
					checked: () => useUIViewOptions().showObjects,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowObjects(),
				},
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.templateEditor",
					checked: () => useUIViewOptions().showTemplateEditor,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowTemplateEditor(),
				},
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.tilesets",
					checked: () => useUIViewOptions().showTilesets,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowTilesets(),
				},
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.terrainSets",
					checked: () => useUIViewOptions().showTerrainSets,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowTerrainSets(),
				},
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.minimap",
					checked: () => useUIViewOptions().showMinimap,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowMinimap(),
				},
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.tileStamps",
					checked: () => useUIViewOptions().showTileStamps,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowTileStamps(),
				},
			],
			[
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.mainToolbar",
					checked: () => useUIViewOptions().showMainToolbar,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowMainToolbar(),
				},
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.tools",
					checked: () => useUIViewOptions().showTools,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowTools(),
				},
				{
					type: "check",
					label: "menu.view.action.viewAndToolbars.toolOptions",
					checked: () => useUIViewOptions().showToolOptions,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowToolOptions(),
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
		checked: () => useDrawingViewOptions().showGrid,
		disabled: () => true,
		toggle: () => useDrawingViewOptions.getState().toggleGrid(),
	},
	{
		type: "check",
		label: "Show Tile Object Outlines",
		checked: () => useDrawingViewOptions().showTileObjectOutlines,
		disabled: () => true,
		toggle: () => useDrawingViewOptions.getState().toggleTileObjectOutlines(),
	},
	{
		type: "check",
		label: "menu.view.action.showObjectReferences",
		checked: () => useDrawingViewOptions().showObjectReferences,
		disabled: () => true,
		toggle: () => useDrawingViewOptions.getState().toggleObjectReferences(),
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
                    value: () => useDrawingViewOptions().showObjectNames,
					disabled: () => true,
                    onValueChange: (value: ShowObjectNamesTypes) => useDrawingViewOptions.getState().setShowObjectNames(value),
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
                    checked: () => useDrawingViewOptions().showNamesForHoveredObjects,
					disabled: () => true,
                    toggle: () => useDrawingViewOptions.getState().toggleNamesForHoveredObjects(),
                }
            ]
        ],
	},
	{
		type: "check",
		label: "menu.view.action.showTileAnimations",
		checked: () => useDrawingViewOptions().showTileAnimations,
		disabled: () => true,
		toggle: () => useDrawingViewOptions.getState().toggleTileAnimations(),
	},
	{
		type: "check",
		label: "menu.view.action.showTileCollisionShapes",
		checked: () => useDrawingViewOptions().showTileCollisionShapes,
		disabled: () => true,
		toggle: () => useDrawingViewOptions.getState().toggleTileCollisionShapes(),
	},
	{
		type: "check",
		label: "menu.view.action.showWorld",
		checked: () => useDrawingViewOptions().showWorld,
		disabled: () => true,
		toggle: () => useDrawingViewOptions.getState().toggleWorld(),
	},
	{
		type: "check",
		label: "menu.view.action.enableParallax",
		checked: () => useDrawingViewOptions().enableParallax,
		disabled: () => true,
		toggle: () => useDrawingViewOptions.getState().toggleParallax(),
	},
	{
		type: "check",
		label: "Highlight Current Layer",
		checked: () => useDrawingViewOptions().highlightCurrentLayer,
		disabled: () => true,
		toggle: () => useDrawingViewOptions.getState().toggleHighlightCurrentLayer(),
	},
	{
		type: "check",
		label: "menu.view.action.highlightHoveredObject",
		checked: () => useDrawingViewOptions().highlightHoveredObject,
		disabled: () => true,
		toggle: () => useDrawingViewOptions.getState().toggleHighlightHoveredObject(),
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
                    value: () => useDrawingViewOptions().snappingMode,
					disabled: () => true,
                    onValueChange: (value: SnappingModeTypes) => useDrawingViewOptions.getState().setSnappingMode(value),
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
