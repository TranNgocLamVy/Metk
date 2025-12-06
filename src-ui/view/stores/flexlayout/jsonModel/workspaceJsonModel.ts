import { IJsonBorderNode, IJsonModel, IJsonRowNode } from "flexlayout-react";

const workspaceRowNode: IJsonRowNode = {
    type: "row",
    children: [
        {
            type: "tabset",
            weight: 25,
            children: [
                {
                    type: "tab",
                    name: "Tilesets",
                    component: "tilesetView",
                    enableClose: false,
                },
                {
                    type: "tab",
                    name: "Layers",
                    component: "layerManager",
                    enableClose: false,
                },
            ],
        },
        {
            type: "tabset",
            weight: 75,
            enableDrag: false,
            enableDrop: false,
            enableMaximize: false,
            enableTabStrip: false,
            children: [
                {
                    type: "tab",
                    name: "TilemapEditor",
                    component: "tilemapEditor",
                    enableClose: false,
                },
            ],
        }
    ],
};

const workspaceBorderNodes: IJsonBorderNode[] = [
    {
        type: "border",
        location: "bottom",
        size: 100,
        enableDrop: false,
        children: [
            {
                type: "tab",
                name: "Terminal",
                id: "Terminal",
                icon: "Terminal",
                component: "Terminal",
                enableDrag: false,
                enableClose: false,
                helpText: "Terminal",
            },
            {
                type: "tab",
                name: "Debug",
                id: "Debug",
                component: "debug",
                enableDrag: false,
                enableClose: false,
                helpText: "Debug",
            },
        ],
    },
];

export const workspaceLayout: IJsonModel = {
    global: {
        splitterSize: 3,
        borderEnableDrop: false,
        tabSetEnableMaximize: false,
        splitterEnableHandle: true,
    },
    borders: workspaceBorderNodes,
    layout: workspaceRowNode,
};