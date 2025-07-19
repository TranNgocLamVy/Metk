
const EditDropdownOptionGroup1: MenuBarDropDownGroupType = [
    {
        type: "option",
        name: "Undo",
    },
    {
        type: "option",
        name: "Redo",
    }
]

const EditDropdownOptionGroup2: MenuBarDropDownGroupType = [
    {
        type: "option",
        name: "Cut",
    },
    {
        type: "option",
        name: "Copy",
    },
    {
        type: "option",
        name: "Paste",
    },
    {
        type: "option",
        name: "Paste in Place",
    },
    {
        type: "option",
        name: "Delete",
    },
]

const EditDropdownOptionGroup3: MenuBarDropDownGroupType = [
    {
        type: "option",
        name: "Select All",
    },
    {
        type: "option",
        name: "Invert Selection",
    },
    {
        type: "option",
        name: "Select None",
    },
]

const EditDropdownOptionGroup4: MenuBarDropDownGroupType = [
    {
        type: "option",
        name: "Preferences",
    },
]


export const EditDropdownOptions: MenuBarItemType = {
    name: "Edit",
    className: "w-52",
    groups: [
        EditDropdownOptionGroup1,
        EditDropdownOptionGroup2,
        EditDropdownOptionGroup3,
        EditDropdownOptionGroup4
    ]
}