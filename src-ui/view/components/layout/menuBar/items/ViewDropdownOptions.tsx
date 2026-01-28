import { CaseSensitive, Eye, Grid3x3, Lock, RectangleHorizontal, RotateCcw, Scan, Search, ZoomIn, ZoomOut } from "lucide-react";

import { ShowObjectNamesTypes, SnappingModeTypes, useDrawingViewOptions } from "@/view/stores/menu/drawingViewStore";
import { useUIViewOptions } from "@/view/stores/menu/uiViewStore";

const ViewDropdownOptionGroup1: MenuDropDownGroupType = [
	{
		type: "subMenu",
		name: "View and Toolbars",
        startIcon: <Eye className="stroke-1" />,
		subMenus: [
			[
				{
					type: "check",
					name: "Project",
					checked: () => useUIViewOptions().showProject,
					toggle: () => useUIViewOptions.getState().toggleShowProject(),
				},
				{
					type: "check",
					name: "Console",
					checked: () => useUIViewOptions().showConsole,
					toggle: () => useUIViewOptions.getState().toggleShowConsole(),
				},
				{
					type: "check",
					name: "Issues",
					checked: () => useUIViewOptions().showIssues,
					toggle: () => useUIViewOptions.getState().toggleShowIssues(),
				},
			],
			[
				{
					type: "check",
					name: "Properties",
					checked: () => useUIViewOptions().showProperties,
					toggle: () => useUIViewOptions.getState().toggleShowProperties(),
				},
				{
					type: "check",
					name: "Layer",
					checked: () => useUIViewOptions().showLayers,
					toggle: () => useUIViewOptions.getState().toggleShowLayers(),
				},
				{
					type: "check",
					name: "History",
					checked: () => useUIViewOptions().showHistory,
					toggle: () => useUIViewOptions.getState().toggleShowHistory(),
				},
				{
					type: "check",
					name: "Objects",
					checked: () => useUIViewOptions().showObjects,
					toggle: () => useUIViewOptions.getState().toggleShowObjects(),
				},
				{
					type: "check",
					name: "Template Editor",
					checked: () => useUIViewOptions().showTemplateEditor,
					toggle: () => useUIViewOptions.getState().toggleShowTemplateEditor(),
				},
				{
					type: "check",
					name: "Tilesets",
					checked: () => useUIViewOptions().showTilesets,
					toggle: () => useUIViewOptions.getState().toggleShowTilesets(),
				},
				{
					type: "check",
					name: "Terrain Sets",
					checked: () => useUIViewOptions().showTerrainSets,
					toggle: () => useUIViewOptions.getState().toggleShowTerrainSets(),
				},
				{
					type: "check",
					name: "Mini-map",
					checked: () => useUIViewOptions().showMinimap,
					toggle: () => useUIViewOptions.getState().toggleShowMinimap(),
				},
				{
					type: "check",
					name: "Tile Stamps",
					checked: () => useUIViewOptions().showTileStamps,
					toggle: () => useUIViewOptions.getState().toggleShowTileStamps(),
				},
			],
			[
				{
					type: "check",
					name: "Main Toolbar",
					checked: () => useUIViewOptions().showMainToolbar,
					toggle: () => useUIViewOptions.getState().toggleShowMainToolbar(),
				},
				{
					type: "check",
					name: "Tools",
					checked: () => useUIViewOptions().showTools,
					toggle: () => useUIViewOptions.getState().toggleShowTools(),
				},
				{
					type: "check",
					name: "Tool Options",
					checked: () => useUIViewOptions().showToolOptions,
					toggle: () => useUIViewOptions.getState().toggleShowToolOptions(),
				},
			],
			[
				{
					type: "option",
					name: "Lock Layout",
                    startIcon: <Lock />,
					onClick() {},
				},
				{
					type: "option",
					name: "Reset to Default Layout",
                    startIcon: <RotateCcw />,
					onClick() {},
				},
			],
		],
	},
	{
		type: "option",
		name: "Search Actions",
		startIcon: <Search />,
		onClick() {},
	},
];

const ViewDropdownOptionGroup2: MenuDropDownGroupType = [
	{
		type: "check",
		name: "Show Grid",
		checked: () => useDrawingViewOptions().showGrid,
		toggle: () => useDrawingViewOptions.getState().toggleGrid(),
	},
	{
		type: "check",
		name: "Show Tile Object Outlines",
		checked: () => useDrawingViewOptions().showTileObjectOutlines,
		toggle: () => useDrawingViewOptions.getState().toggleTileObjectOutlines(),
	},
	{
		type: "check",
		name: "Show Object References",
		checked: () => useDrawingViewOptions().showObjectReferences,
		toggle: () => useDrawingViewOptions.getState().toggleObjectReferences(),
	},
	{
		type: "subMenu",
		name: "Show Object Names",
        startIcon: <CaseSensitive />,
		subMenus: [
            [
                {
                    type: "radio",
                    name: "Show Object Names",
                    value: () => useDrawingViewOptions().showObjectNames,
                    onValueChange: (value: ShowObjectNamesTypes) => useDrawingViewOptions.getState().setShowObjectNames(value),
                    items: [
                        {
                            name: "Never",
                            value: "Never",
                        },
                        {
                            name: "For Selected Objects",
                            value: "ForSelectedObjects",
                        },
                        {
                            name: "For All Objects",
                            value: "ForAllObjects",
                        },
                    ]
                }
            ],
            [
                {
                    type: "check",
                    name: "For Hovered Objects",
                    checked: () => useDrawingViewOptions().showNamesForHoveredObjects,
                    toggle: () => useDrawingViewOptions.getState().toggleNamesForHoveredObjects(),
                }
            ]
        ],
	},
	{
		type: "check",
		name: "Show Tile Animations",
		checked: () => useDrawingViewOptions().showTileAnimations,
		toggle: () => useDrawingViewOptions.getState().toggleTileAnimations(),
	},
	{
		type: "check",
		name: "Show Tile Collision Shapes",
		checked: () => useDrawingViewOptions().showTileCollisionShapes,
		toggle: () => useDrawingViewOptions.getState().toggleTileCollisionShapes(),
	},
	{
		type: "check",
		name: "Show World",
		checked: () => useDrawingViewOptions().showWorld,
		toggle: () => useDrawingViewOptions.getState().toggleWorld(),
	},
	{
		type: "check",
		name: "Enable Parallax",
		checked: () => useDrawingViewOptions().enableParallax,
		toggle: () => useDrawingViewOptions.getState().toggleParallax(),
	},
	{
		type: "check",
		name: "Highlight Current Layer",
		checked: () => useDrawingViewOptions().highlightCurrentLayer,
		toggle: () => useDrawingViewOptions.getState().toggleHighlightCurrentLayer(),
	},
	{
		type: "check",
		name: "Highlight Hovered Object",
		checked: () => useDrawingViewOptions().highlightHoveredObject,
		toggle: () => useDrawingViewOptions.getState().toggleHighlightHoveredObject(),
	},
];

const ViewDropdownOptionGroup3: MenuDropDownGroupType = [
	{
		type: "subMenu",
		name: "Snapping",
        startIcon: <Grid3x3 className="stroke-1" />,
		subMenus: [
            [
                {
                    type: "radio",
                    name: "Snapping",
                    value: () => useDrawingViewOptions().snappingMode,
                    onValueChange: (value: SnappingModeTypes) => useDrawingViewOptions.getState().setSnappingMode(value),
                    items: [
                        {
                            name: "No Snapping",
                            value: "None",
                        },
                        {
                            name: "Snap to Grid",
                            value: "Grid",
                        },
                        {
                            name: "Snap to Fine Grid",
                            value: "FineGrid",
                        },
                        {
                            name: "Snap to Pixel",
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
		name: "Zoom In",
        startIcon: <ZoomIn />,
		onClick() {},
	},
	{
		type: "option",
		name: "Zoom Out",
        startIcon: <ZoomOut />,
		onClick() {},
	},
	{
		type: "option",
		name: "Normal Size",
        startIcon: <RectangleHorizontal />,
		onClick() {},
	},
	{
		type: "option",
		name: "Fit Map in View",
        startIcon: <Scan />,
		onClick() {},
	},
];

const ViewDropdownOptionGroup5: MenuDropDownGroupType = [
    {
		type: "check",
		name: "Clear View",
		checked: () => false,
		toggle: () => {

        },
	},
];

export const ViewDropdownOptions: MenuItemType = {
	name: "menuBar.view",
	className: "w-110",
	groups: [ViewDropdownOptionGroup1, ViewDropdownOptionGroup2, ViewDropdownOptionGroup3, ViewDropdownOptionGroup4, ViewDropdownOptionGroup5],
};
