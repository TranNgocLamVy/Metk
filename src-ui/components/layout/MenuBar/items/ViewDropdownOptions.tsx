import { Lock, RotateCcw, Search, CaseSensitive, ZoomIn, ZoomOut, Scan, Grid3x3, Eye, RectangleHorizontal } from "lucide-react";

const ViewDropdownOptionGroup1: MenuBarDropDownGroupType = [
	{
		type: "subMenu",
		name: "View and Toolbars",
        startIcon: <Eye className="stroke-1" />,
		subMenus: [
			[
				{
					type: "check",
					name: "Project",
					checked: () => false,
					onCheckedChange(checked) {},
				},
				{
					type: "check",
					name: "Console",
					checked: () => false,
					onCheckedChange(checked) {},
				},
				{
					type: "check",
					name: "Issues",
					checked: () => false,
					onCheckedChange(checked) {},
				},
			],
			[
				{
					type: "check",
					name: "Properties",
					checked: () => false,
					onCheckedChange(checked) {},
				},
				{
					type: "check",
					name: "Layer",
					checked: () => false,
					onCheckedChange(checked) {},
				},
				{
					type: "check",
					name: "History",
					checked: () => false,
					onCheckedChange(checked) {},
				},
				{
					type: "check",
					name: "Objects",
					checked: () => false,
					onCheckedChange(checked) {},
				},
				{
					type: "check",
					name: "Template Editor",
					checked: () => false,
					onCheckedChange(checked) {},
				},
				{
					type: "check",
					name: "Tilesets",
					checked: () => false,
					onCheckedChange(checked) {},
				},
				{
					type: "check",
					name: "Terrain Sets",
					checked: () => false,
					onCheckedChange(checked) {},
				},
				{
					type: "check",
					name: "Mini-map",
					checked: () => false,
					onCheckedChange(checked) {},
				},
				{
					type: "check",
					name: "Tile Stamps",
					checked: () => false,
					onCheckedChange(checked) {},
				},
			],
			[
				{
					type: "check",
					name: "Main Toolbar",
					checked: () => false,
					onCheckedChange(checked) {},
				},
				{
					type: "check",
					name: "Tools",
					checked: () => false,
					onCheckedChange(checked) {},
				},
				{
					type: "check",
					name: "Tool Options",
					checked: () => false,
					onCheckedChange(checked) {},
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

const ViewDropdownOptionGroup2: MenuBarDropDownGroupType = [
	{
		type: "check",
		name: "Show Grid",
		checked: () => true,
		onCheckedChange(checked) {},
	},
	{
		type: "check",
		name: "Show Tile Object Outlines",
		checked: () => false,
		onCheckedChange(checked) {},
	},
	{
		type: "check",
		name: "Show Object References",
		checked: () => false,
		onCheckedChange(checked) {},
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
                    value: () => "Never",
                    onValueChange(value) {},
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
                    checked: () => false,
                    onCheckedChange(checked) {},
                }
            ]
        ],
	},
	{
		type: "check",
		name: "Show Tile Animations",
		checked: () => false,
		onCheckedChange(checked) {},
	},
	{
		type: "check",
		name: "Show Tile Collision Shapes",
		checked: () => false,
		onCheckedChange(checked) {},
	},
	{
		type: "check",
		name: "Show World",
		checked: () => false,
		onCheckedChange(checked) {},
	},
	{
		type: "check",
		name: "Enable Parallax",
		checked: () => false,
		onCheckedChange(checked) {},
	},
	{
		type: "check",
		name: "Highlight Current Layer",
		checked: () => false,
		onCheckedChange(checked) {},
	},
	{
		type: "check",
		name: "Highlight Hovered Object",
		checked: () => false,
		onCheckedChange(checked) {},
	},
];

const ViewDropdownOptionGroup3: MenuBarDropDownGroupType = [
	{
		type: "subMenu",
		name: "Snapping",
        startIcon: <Grid3x3 className="stroke-1" />,
		subMenus: [
            [
                {
                    type: "radio",
                    name: "Snapping",
                    value: () => "Pixel",
                    onValueChange(value) {},
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

const ViewDropdownOptionGroup4: MenuBarDropDownGroupType = [
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

const ViewDropdownOptionGroup5: MenuBarDropDownGroupType = [
	{
		type: "check",
		name: "Fullscreen",
		checked: () => false,
		onCheckedChange(checked) {},
	},
    {
		type: "check",
		name: "Clear View",
		checked: () => false,
		onCheckedChange(checked) {},
	},
];

export const ViewDropdownOptions: MenuBarItemType = {
	name: "View",
	className: "w-80",
	groups: [ViewDropdownOptionGroup1, ViewDropdownOptionGroup2, ViewDropdownOptionGroup3, ViewDropdownOptionGroup4, ViewDropdownOptionGroup5],
};
