

declare global {
    type MenuBarItemType = {
        name: string
        visible?: () => boolean;
        disabled?: () => boolean;
        className?: string;
        groups: MenuBarDropDownGroupType[];
    }

    type MenuBarDropDownGroupType = MenuBarDropDownItemType[] | (() => MenuBarDropDownItemType[])

    type MenuBarDropDownItemType = MenuBarDropDownOptionItemType | MenuBarDropDownCheckItemType | MenuBarDropDownRadioItemType

    type MenuBarDropDownOptionItemType = {
        type: 'option';
        name: string;
        visible?: () => boolean;
        disabled?: () => boolean;
        onClick?: () => void;
        subMenus?: MenuBarDropDownGroupType[];
        subMenusClassName?: string;
    }

    type MenuBarDropDownCheckItemType = {
        type: 'check';
        name: string;
        visible?: () => boolean;
        disabled?: () => boolean;
        checked: () => boolean;
        onCheckedChange: (checked: boolean) => void;
    }

    type MenuBarDropDownRadioItemType = {
        type: 'radio';
        name: string;
        visible?: () => boolean;
        disabled?: () => boolean;
        value: () => string;
        onValueChange: (value: string) => void;
        items: {
            name: string;
            value: string;
            visible?: () => boolean;
            disabled?: () => boolean;
        }
    }
}

export { }