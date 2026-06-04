import { IJsonModel, IJsonRowNode } from "flexlayout-react";

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
                            id: "tilesetView",
                            name: "Tilesets",
                            minHeight: 200,
                            minWidth: 300,
                            component: "tilesetView",
                            enableClose: false,
                        },
                        {
                            type: "tab",
                            id: "rulesetManager",
                            name: "Rulesets",
                            minHeight: 200,
                            minWidth: 300,
                            component: "rulesetManager",
                            enableClose: false,
                        },
                        {
                            type: "tab",
                            id: "entityCollectionManager",
                            name: "Entity Collections",
                            minHeight: 200,
                            minWidth: 300,
                            component: "entityCollectionManager",
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
                            id: "layerManager",
                            name: "Layers",
                            minHeight: 200,
                            minWidth: 300,
                            component: "layerManager",
                            enableClose: false,
                        }
                    ]
                },
            ]
        },
        {
            type: "tabset",
            id: "mainEditorTabset",
            weight: 80,
            enableDrag: false,
            enableDrop: false,
            enableMaximize: false,
            enableTabStrip: false,
            children: [
                {
                    type: "tab",
                    id: "tilemapEditor",
                    name: "TilemapEditor",
                    component: "tilemapEditor",
                    enableClose: false,
                    minHeight: 400,
                    minWidth: 400,
                },
            ],
        },
        {
            type: "tabset",
            weight: 25,
            children: [
                {
                    type: "tab",
                    id: "properties",
                    name: "Properties",
                    minHeight: 200,
                    minWidth: 280,
                    component: "properties",
                    enableClose: false,
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
