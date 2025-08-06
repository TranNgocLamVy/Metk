import { MapPlus, Upload, Save } from "lucide-react"

const WorldDropdownOptionGroup1: MenuDropDownGroupType = [
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

const WorldDropdownOptionGroup2: MenuDropDownGroupType = [
    {
        type: "option",
        name: "Save World",
        startIcon: <Save />,
        onClick() { },
    }
]


export const WorldDropdownOptions: MenuItemType = {
    name: "World",
    className: "w-80",
    groups: [
        WorldDropdownOptionGroup1,
        WorldDropdownOptionGroup2
    ]
}