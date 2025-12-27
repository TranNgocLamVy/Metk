import { Brush, ClipboardPaste, Copy, Eraser, Grid3x3, PaintBucket, Redo, Scissors, Stamp, Trash2, Undo } from "lucide-react";

const UndoRedoGroup: MenuDropDownGroupType = [
    {
        type: "option",
        name: "Undo",
        startIcon: <Undo />,
        onClick() {},
    },
    {
        type: "option",
        name: "Redo",
        startIcon: <Redo />,
        onClick() {},
    },
];

const EditGroup: MenuDropDownGroupType = [
    {
        type: "option",
        name: "Cut",
        startIcon: <Scissors />,
        onClick() { },
    },
    {
        type: "option",
        name: "Copy",
        startIcon: <Copy />,
        onClick() { },
    },
    {
        type: "option",
        name: "Paste",
        startIcon: <ClipboardPaste />,
        onClick() { },
    },
    {
        type: "option",
        name: "Delete",
        startIcon: <Trash2 />,
        onClick() { },
    },
];

const SnappingGroup: MenuDropDownGroupType = [
    {
        type: "subMenu",
        name: "Snapping",
        startIcon: <Grid3x3 className="stroke-1" />,
        subMenusClassName: "w-60",
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
                    ],
                },
            ],
        ],
    },
];

const BrushGroup: MenuDropDownGroupType = [
    {
        type: "subMenu",
        name: "Brush",
        startIcon: <Brush className="stroke-1" />,
        subMenusClassName: "w-60",
        subMenus: [
            [
                {
                    type: "radio",
                    name: "Brush Types",
                    value: () => "Stamp",
                    onValueChange(value) {},
                    items: [
                        {
                            name: "Stamp",
                            value: "Stamp",
                            startIcon: <Stamp className="stroke-1" />,
                        },
                        {
                            name: "Bucket",
                            value: "Bucket",
                            startIcon: <PaintBucket className="stroke-1" />,
                        },
                        {
                            name: "Erase",
                            value: "Erase",
                            startIcon: <Eraser className="stroke-1" />,
                        },
                    ],
                },
            ],
        ],
    },
];

export const TilesetViewContextMenu: MenuItemType = {
    name: "Edit",
    className: "w-60",
    groups: [UndoRedoGroup, EditGroup, BrushGroup, SnappingGroup],
};
