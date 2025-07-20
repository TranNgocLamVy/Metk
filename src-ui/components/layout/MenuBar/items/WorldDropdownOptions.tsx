import { MapPlus, Upload, Save } from "lucide-react"

const WorldDropdownOptionGroup1: MenuBarDropDownGroupType = [
    {
        type: "option",
        name: "New World",
        startIcon: <MapPlus />,
        onClick() { },
    },
    {
        type: "option",
        name: "Load World",
        startIcon: <Upload />,
        onClick() { },
    }
]

const WorldDropdownOptionGroup2: MenuBarDropDownGroupType = [
    {
        type: "option",
        name: "Save World",
        startIcon: <Save />,
        onClick() { },
    }
]


export const WorldDropdownOptions: MenuBarItemType = {
    name: "World",
    className: "w-70",
    groups: [
        WorldDropdownOptionGroup1,
        WorldDropdownOptionGroup2
    ]
}