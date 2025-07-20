import { FolderCog, FolderPlus, FolderSync } from "lucide-react"

const ProjectDropdownOptionGroup1: MenuBarDropDownGroupType = [
    {
        type: "option",
        name: "Add Folder to Project",
        startIcon: <FolderPlus />,
        onClick() { },
    },
    {
        type: "option",
        name: "Refresh Project",
        startIcon: <FolderSync />,
        onClick() { },
    }
]

const ProjectDropdownOptionGroup2: MenuBarDropDownGroupType = [
    {
        type: "option",
        name: "Project Properties",
        startIcon: <FolderCog />,
        onClick() { },
    },
]


export const ProjectDropdownOptions: MenuBarItemType = {
    name: "Project",
    className: "w-70",
    groups: [
        ProjectDropdownOptionGroup1,
        ProjectDropdownOptionGroup2
    ]
}