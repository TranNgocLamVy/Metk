import { ShowEntityName, Snapping } from "./setting.enum";
import type { SettingKeyFromPages, SettingPage, SettingValueFromPages } from "./setting.types";

export const defaultSettingPages = [
    {
        key: "general",
        label: "setting.general.label",
        description: "setting.general.description",
        groups: [
            {
                key: "layout",
                visible: false,
                settings: [
                    {
                        key: "console",
                        type: "boolean",
                        visible: false,
                        defaultValue: true,
                    },
                    {
                        key: "issues",
                        type: "boolean",
                        visible: false,
                        defaultValue: true,
                    },
                    {
                        key: "properties",
                        type: "boolean",
                        visible: false,
                        defaultValue: true,
                    },
                    {
                        key: "layers",
                        type: "boolean",
                        visible: false,
                        defaultValue: true,
                    },
                    {
                        key: "entities",
                        type: "boolean",
                        visible: false,
                        defaultValue: true,
                    },
                    {
                        key: "tilesets",
                        type: "boolean",
                        visible: false,
                        defaultValue: true,
                    },
                    {
                        key: "rulesets",
                        type: "boolean",
                        visible: false,
                        defaultValue: true,
                    },
                ],
            },
            {
                key: "view",
                visible: false,
                settings: [
                    {
                        key: "showGrid",
                        type: "boolean",
                        visible: false,
                        defaultValue: true,
                    },
                    {
                        key: "showEntityOutline",
                        type: "boolean",
                        visible: false,
                        defaultValue: true,
                    },
                    {
                        key: "showEntityName",
                        type: "enum",
                        visible: false,
                        defaultValue: ShowEntityName.ForAllEntities,
                        enumValues: [
                            {
                                value: ShowEntityName.Never,
                                label: "",
                            },
                            {
                                value: ShowEntityName.ForSelectedEntities,
                                label: "",
                            },
                            {
                                value: ShowEntityName.ForAllEntities,
                                label: ""
                            },
                            {
                                value: ShowEntityName.ForHoveredEntitie,
                                label: ""
                            }
                        ]
                    },
                    {
                        key: "showTileAnimations",
                        type: "boolean",
                        visible: false,
                        defaultValue: true,
                    },
                    {
                        key: "showTileCollisionShapes",
                        type: "boolean",
                        visible: false,
                        defaultValue: true,
                    },
                    {
                        key: "enableParallax",
                        type: "boolean",
                        visible: false,
                        defaultValue: true,
                    },
                    {
                        key: "highlightCurrentLayer",
                        type: "boolean",
                        visible: false,
                        defaultValue: true,
                    },
                    {
                        key: "highlightHoveredEntity",
                        type: "boolean",
                        visible: false,
                        defaultValue: true,
                    },
                    {
                        key: "snapping",
                        type: "enum",
                        visible: false,
                        defaultValue: Snapping.SnapToGrid,
                        enumValues: [
                            {
                                value: Snapping.NoSnap,
                                label: "",
                            },
                            {
                                value: Snapping.SnapToGrid,
                                label: "",
                            },
                            {
                                value: Snapping.SnapToFineGrid,
                                label: ""
                            },
                            {
                                value: Snapping.SnapToPixel,
                                label: ""
                            }
                        ]
                    },
                ]
            }
        ],
    },
] as const satisfies readonly SettingPage[];

export type DefaultSettingPages = typeof defaultSettingPages;
export type DefaultSettingKey = SettingKeyFromPages<DefaultSettingPages>;
export type DefaultSettingValue<TKey extends DefaultSettingKey> = SettingValueFromPages<DefaultSettingPages, TKey>;
