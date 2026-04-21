import { CaseSensitive, Eye, Grid3x3, Lock, RectangleHorizontal, RotateCcw, Scan, Search, ZoomIn, ZoomOut } from "lucide-react";

import { ShowObjectNamesTypes, SnappingModeTypes, useDrawingViewOptions } from "@/view/stores/drawingViewStore";
import { useUIViewOptions } from "@/view/stores/uiViewStore";

const ViewDropdownOptionGroup1: MenuDropDownGroupType = [
	{
		type: "subMenu",
		label: "menu.view.actions.viewAndToolbars.label",
        startIcon: <Eye className="stroke-1" />,
		subMenus: [
			[
				{
					type: "check",
					label: "menu.view.actions.viewAndToolbars.project",
					checked: () => useUIViewOptions().showProject,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowProject(),
				},
				{
					type: "check",
					label: "menu.view.actions.viewAndToolbars.console",
					checked: () => useUIViewOptions().showConsole,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowConsole(),
				},
				{
					type: "check",
					label: "menu.view.actions.viewAndToolbars.issues",
					checked: () => useUIViewOptions().showIssues,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowIssues(),
				},
			],
			[
				{
					type: "check",
					label: "menu.view.actions.viewAndToolbars.properties",
					checked: () => useUIViewOptions().showProperties,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowProperties(),
				},
				{
					type: "check",
					label: "menu.view.actions.viewAndToolbars.layer",
					checked: () => useUIViewOptions().showLayers,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowLayers(),
				},
				{
					type: "check",
					label: "menu.view.actions.viewAndToolbars.history",
					checked: () => useUIViewOptions().showHistory,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowHistory(),
				},
				{
					type: "check",
					label: "menu.view.actions.viewAndToolbars.objects",
					checked: () => useUIViewOptions().showObjects,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowObjects(),
				},
				{
					type: "check",
					label: "menu.view.actions.viewAndToolbars.templateEditor",
					checked: () => useUIViewOptions().showTemplateEditor,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowTemplateEditor(),
				},
				{
					type: "check",
					label: "menu.view.actions.viewAndToolbars.tilesets",
					checked: () => useUIViewOptions().showTilesets,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowTilesets(),
				},
				{
					type: "check",
					label: "menu.view.actions.viewAndToolbars.terrainSets",
					checked: () => useUIViewOptions().showTerrainSets,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowTerrainSets(),
				},
				{
					type: "check",
					label: "menu.view.actions.viewAndToolbars.minimap",
					checked: () => useUIViewOptions().showMinimap,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowMinimap(),
				},
				{
					type: "check",
					label: "menu.view.actions.viewAndToolbars.tileStamps",
					checked: () => useUIViewOptions().showTileStamps,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowTileStamps(),
				},
			],
			[
				{
					type: "check",
					label: "menu.view.actions.viewAndToolbars.mainToolbar",
					checked: () => useUIViewOptions().showMainToolbar,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowMainToolbar(),
				},
				{
					type: "check",
					label: "menu.view.actions.viewAndToolbars.tools",
					checked: () => useUIViewOptions().showTools,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowTools(),
				},
				{
					type: "check",
					label: "menu.view.actions.viewAndToolbars.toolOptions",
					checked: () => useUIViewOptions().showToolOptions,
					disabled: () => true,
					toggle: () => useUIViewOptions.getState().toggleShowToolOptions(),
				},
			],
			[
				{
					type: "option",
					label: "menu.view.actions.viewAndToolbars.lockLayout",
                    startIcon: <Lock />,
					disabled: () => true,
					onClick() {},
				},
				{
					type: "option",
					label: "menu.view.actions.viewAndToolbars.resetToDefaultLayout",
                    startIcon: <RotateCcw />,
					disabled: () => true,
					onClick() {},
				},
			],
		],
	},
	{
		type: "option",
		label: "menu.view.actions.searchActions",
		startIcon: <Search />,
		disabled: () => true,
		onClick() {},
	},
];

const ViewDropdownOptionGroup2: MenuDropDownGroupType = [
	{
		type: "check",
		label: "menu.view.actions.showGrid",
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
		label: "menu.view.actions.showObjectReferences",
		checked: () => useDrawingViewOptions().showObjectReferences,
		disabled: () => true,
		toggle: () => useDrawingViewOptions.getState().toggleObjectReferences(),
	},
	{
		type: "subMenu",
		label: "menu.view.actions.showObjectNames.label",
        startIcon: <CaseSensitive />,
		subMenus: [
            [
                {
                    type: "radio",
                    label: "menu.view.actions.showObjectNames.never",
                    value: () => useDrawingViewOptions().showObjectNames,
					disabled: () => true,
                    onValueChange: (value: ShowObjectNamesTypes) => useDrawingViewOptions.getState().setShowObjectNames(value),
                    items: [
                        {
                            label: "menu.view.actions.showObjectNames.never",
                            value: "Never",
                        },
                        {
                            label: "menu.view.actions.showObjectNames.forSelectedObjects",
                            value: "ForSelectedObjects",
                        },
                        {
                            label: "menu.view.actions.showObjectNames.forAllObjects",
                            value: "ForAllObjects",
                        },
                    ]
                }
            ],
            [
                {
                    type: "check",
                    label: "menu.view.actions.showObjectNames.forHoveredObjects",
                    checked: () => useDrawingViewOptions().showNamesForHoveredObjects,
					disabled: () => true,
                    toggle: () => useDrawingViewOptions.getState().toggleNamesForHoveredObjects(),
                }
            ]
        ],
	},
	{
		type: "check",
		label: "menu.view.actions.showTileAnimations",
		checked: () => useDrawingViewOptions().showTileAnimations,
		disabled: () => true,
		toggle: () => useDrawingViewOptions.getState().toggleTileAnimations(),
	},
	{
		type: "check",
		label: "menu.view.actions.showTileCollisionShapes",
		checked: () => useDrawingViewOptions().showTileCollisionShapes,
		disabled: () => true,
		toggle: () => useDrawingViewOptions.getState().toggleTileCollisionShapes(),
	},
	{
		type: "check",
		label: "menu.view.actions.showWorld",
		checked: () => useDrawingViewOptions().showWorld,
		disabled: () => true,
		toggle: () => useDrawingViewOptions.getState().toggleWorld(),
	},
	{
		type: "check",
		label: "menu.view.actions.enableParallax",
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
		label: "menu.view.actions.highlightHoveredObject",
		checked: () => useDrawingViewOptions().highlightHoveredObject,
		disabled: () => true,
		toggle: () => useDrawingViewOptions.getState().toggleHighlightHoveredObject(),
	},
];

const ViewDropdownOptionGroup3: MenuDropDownGroupType = [
	{
		type: "subMenu",
		label: "menu.view.actions.snapping.label",
        startIcon: <Grid3x3 className="stroke-1" />,
		subMenus: [
            [
                {
                    type: "radio",
                    label: "menu.view.actions.snapping.label",
                    value: () => useDrawingViewOptions().snappingMode,
					disabled: () => true,
                    onValueChange: (value: SnappingModeTypes) => useDrawingViewOptions.getState().setSnappingMode(value),
                    items: [
                        {
                            label: "menu.view.actions.snapping.noSnapping",
                            value: "None",
                        },
                        {
                            label: "menu.view.actions.snapping.snapToGrid",
                            value: "Grid",
                        },
                        {
                            label: "menu.view.actions.snapping.snapToFineGrid",
                            value: "FineGrid",
                        },
                        {
                            label: "menu.view.actions.snapping.snapToPixel",
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
		label: "menu.view.actions.zoomIn",
        startIcon: <ZoomIn />,
		disabled: () => true,
		onClick() {},
	},
	{
		type: "option",
		label: "menu.view.actions.zoomOut",
        startIcon: <ZoomOut />,
		disabled: () => true,
		onClick() {},
	},
	{
		type: "option",
		label: "menu.view.actions.normalSize",
        startIcon: <RectangleHorizontal />,
		disabled: () => true,
		onClick() {},
	},
	{
		type: "option",
		label: "menu.view.actions.fitMapInView",
        startIcon: <Scan />,
		disabled: () => true,
		onClick() {},
	},
];

const ViewDropdownOptionGroup5: MenuDropDownGroupType = [
    {
		type: "check",
		label: "menu.view.actions.clearView",
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
