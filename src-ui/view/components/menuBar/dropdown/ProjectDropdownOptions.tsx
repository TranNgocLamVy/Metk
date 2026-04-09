import { FolderCog, FolderPlus, FolderSync } from "lucide-react";

const ProjectDropdownOptionGroup1: MenuDropDownGroupType = [
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

const ProjectDropdownOptionGroup2: MenuDropDownGroupType = [
    {
        type: "option",
        name: "Project Properties",
        startIcon: <FolderCog />,
        onClick() { },
    },
]


export const ProjectDropdownOptions: MenuItemType = {
    name: "menuBar.project",
    className: "w-100",
    groups: [
        ProjectDropdownOptionGroup1,
        ProjectDropdownOptionGroup2
    ]
}