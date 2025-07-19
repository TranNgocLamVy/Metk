
const FileDropdownOptionGroup1: MenuBarDropDownGroupType = [
    {
        type: "option",
        name: "New",
        subMenus: [
            [
                {
                    type: "option",
                    name: "New Project",
                }
            ],
            [
                {
                    type: "option",
                    name: "New Map",
                },
                {
                    type: "option",
                    name: "New Tileset",
                },
            ]
        ]
    },
    {
        type: "option",
        name: "Open File or Project",
    },
    {
        type: "option",
        name: "Open File in Project",
    },
    {
        type: "option",
        name: "Recent Files",
        subMenus: [
            [
                {
                    type: "option",
                    name: "Reopen Closed File",
                }
            ],
            [
                {
                    type: "option",
                    name: "Clear Recent Files",
                }
            ]
        ]
    },
    {
        type: "option",
        name: "Recent Project",
        subMenus: [
            [
                {
                    type: "option",
                    name: "Clear Recent Projects",
                }
            ]
        ]
    }
]

const FileDropdownOptionGroup2: MenuBarDropDownGroupType = [
    {
        type: "option",
        name: "Save",
    },
    {
        type: "option",
        name: "Save As",
    },
    {
        type: "option",
        name: "Save All",
    },
    {
        type: "option",
        name: "Export",
    },
    {
        type: "option",
        name: "Export as",
    },
    {
        type: "option",
        name: "Export as Image",
    },
    
]

const FileDropdownOptionGroup3: MenuBarDropDownGroupType = [
    {
        type: "option",
        name: "Command",
        subMenus: [[
            {
                type: "option",
                name: "Edit Command",
            }
        ]]
    }
]

const FileDropdownOptionGroup4: MenuBarDropDownGroupType = [
    {
        type: "option",
        name: "Close",
    },
    {
        type: "option",
        name: "Close All",
    },
    {
        type: "option",
        name: "Close Project",
    },
    {
        type: "option",
        name: "Quit",
    }
]



export const FileDropdownOptions: MenuBarItemType = {
    name: "File",
    groups: [
        FileDropdownOptionGroup1,
        FileDropdownOptionGroup2,
        FileDropdownOptionGroup3,
        FileDropdownOptionGroup4
    ]
}