
const HelpDropdownOptionGroup1: MenuBarDropDownGroupType = [
    {
        type: "option",
        name: "User Manual",
    },
    {
        type: "option",
        name: "Community Forum",
    }
]

const HelpDropdownOptionGroup2: MenuBarDropDownGroupType = [
    {
        type: "option",
        name: "Support developer",
    },
    {
        type: "option",
        name: "About application",
    }
]


export const HelpDropdownOptions: MenuBarItemType = {
    name: "Help",
    className: "w-52",
    groups: [
        HelpDropdownOptionGroup1,
        HelpDropdownOptionGroup2
    ]
}