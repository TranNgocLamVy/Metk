import { FolderCog, FolderPlus, FolderSync } from "lucide-react";

const ProjectDropdownOptionGroup1: MenuDropDownGroupType = [
    {
        type: "option",
        label: "menu.project.action.addFolderToProject",
        startIcon: <FolderPlus />,
        disabled: () => true,
        onClick() { },
    },
    {
        type: "option",
        label: "menu.project.action.refreshProject",
        startIcon: <FolderSync />,
        disabled: () => true,
        onClick() { },
    }
]

const ProjectDropdownOptionGroup2: MenuDropDownGroupType = [
    {
        type: "option",
        label: "menu.project.action.projectProperties",
        startIcon: <FolderCog />,
        disabled: () => true,
        onClick() { },
    },
]


export const ProjectDropdownOptions: MenuItemType = {
    label: "menu.project.label",
    className: "w-100",
    groups: [
        ProjectDropdownOptionGroup1,
        ProjectDropdownOptionGroup2
    ]
}