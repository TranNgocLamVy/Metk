import { Book, HeartPlus, MessageSquare, Star } from "lucide-react"

const HelpDropdownOptionGroup1: MenuBarDropDownGroupType = [
    {
        type: "option",
        name: "User Manual",
        startIcon: <Book />,
        onClick() { },
    },
    {
        type: "option",
        name: "Community Forum",
        startIcon: <MessageSquare />,
        onClick() { },
    }
]

const HelpDropdownOptionGroup2: MenuBarDropDownGroupType = [
    {
        type: "option",
        name: "Support developer",
        startIcon: <HeartPlus />,
        onClick() { },
    },
    {
        type: "option",
        name: "About application",
        startIcon: <Star />,
        onClick() { },
    }
]


export const HelpDropdownOptions: MenuBarItemType = {
    name: "Help",
    className: "w-70",
    groups: [
        HelpDropdownOptionGroup1,
        HelpDropdownOptionGroup2
    ]
}