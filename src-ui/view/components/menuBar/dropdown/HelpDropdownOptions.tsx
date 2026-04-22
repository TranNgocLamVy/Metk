import { Book, HeartPlus, MessageSquareMore } from "lucide-react";

const HelpDropdownOptionGroup1: MenuDropDownGroupType = [
    {
        type: "option",
        label: "menu.help.actions.userManual",
        startIcon: <Book />,
        disabled: () => true,
        onClick() { },
    },
    {
        type: "option",
        label: "menu.help.actions.reportIssue",
        startIcon: <MessageSquareMore />,
        disabled: () => true,
        onClick() { },
    }
]

const HelpDropdownOptionGroup2: MenuDropDownGroupType = [
    {
        type: "option",
        label: "menu.help.actions.supportDeveloper",
        startIcon: <HeartPlus />,
        disabled: () => true,
        onClick() { },
    }
]


export const HelpDropdownOptions: MenuItemType = {
    label: "menu.help.label",
    className: "w-80",
    groups: [
        HelpDropdownOptionGroup1,
        HelpDropdownOptionGroup2
    ]
}