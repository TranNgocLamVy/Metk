import { SettingPage } from "./setting.types";

export const defaultSettingPages: SettingPage[] = [
    {
        key: "general",
        label: "setting.general.label",
        description: "setting.general.description",
        groups: [
            {
                key: "view",
                label: "setting.general.view.label",
                description: "setting.general.view.description",
                settings: [
                    {
                        key: "showGrid",
                        label: "setting.general.view.showGrid.label",
                        description: "setting.general.view.showGrid.description",
                        type: "boolean",
                        defaultValue: true,
                    },
                    {
                        key: "theme",
                        label: "setting.general.view.theme.label",
                        description: "setting.general.view.theme.description",
                        type: "enum",
                        defaultValue: "system",
                        enumValues: [
                            { value: "system", label: "setting.general.view.theme.system" },
                            { value: "light", label: "setting.general.view.theme.light" },
                            { value: "dark", label: "setting.general.view.theme.dark" },
                        ],
                    },
                ],
            },
        ],
    },
];
