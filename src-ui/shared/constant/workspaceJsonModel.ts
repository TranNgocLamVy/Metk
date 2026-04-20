import { IJsonBorderNode, IJsonModel, IJsonRowNode } from "flexlayout-react";

const workspaceRowNode: IJsonRowNode = {
    type: "row",
    children: [
        {
            type: "col",
            weight: 25,
            children: [
                {
                    type: "tabset",
                    weight: 50,
                    children: [
                        {
                            type: "tab",
                            name: "Tilesets",
                            minHeight: 200,
                            minWidth: 300,
                            component: "tilesetView",
                            enableClose: false,
                        },
                        {
                            type: "tab",
                            name: "Rulesets",
                            minHeight: 200,
                            minWidth: 300,
                            component: "rulesetManager",
                            enableClose: false,
                        },

                    ],
                },
                {
                    type: "tabset",
                    weight: 50,
                    children: [
                        {
                            type: "tab",
                            name: "Layers",
                            minHeight: 200,
                            minWidth: 300,
                            component: "layerManager",
                            enableClose: false,
                        }
                    ]
                }
            ]
        },
        {
            type: "tabset",
            weight: 80,
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
                    minHeight: 400,
                    minWidth: 800,
                },
            ],
        },
    ],
};

export const workspaceLayout: IJsonModel = {
    global: {
        splitterSize: 0,
        splitterExtra: 10,
        borderEnableDrop: false,
        tabSetEnableMaximize: false,
        splitterEnableHandle: true,
        tabEnableRename: false,
        tabEnableRenderOnDemand: true,


    },
    layout: workspaceRowNode,
};