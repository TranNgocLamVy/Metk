

declare global {
    type MenuBarItemType = {
        name: string | (() => string);
        visible?: () => boolean;
        disabled?: () => boolean;
        className?: string;
        groups: MenuBarDropDownGroupType[];
    }

    type MenuBarDropDownGroupType = MenuBarDropDownItemType[] | (() => MenuBarDropDownItemType[])

    type MenuBarDropDownItemType = MenuBarDropDownOptionItemType | MenuBarDropDownCheckItemType | MenuBarDropDownRadioItemType | MenuBarDropDownSubMenuItemType;

    type MenuBarDropDownOptionItemType = {
        type: 'option';
        name: string | (() => string);
        startIcon?: React.ReactNode;
        endIcon?: React.ReactNode;
        shortCut?: string;
        visible?: () => boolean;
        disabled?: () => boolean;
        onClick: () => void;
    }

    type MenuBarDropDownSubMenuItemType = {
        type: 'subMenu';
        name: string | (() => string);
        startIcon?: React.ReactNode;
        endIcon?: React.ReactNode;
        shortCut?: string;
        visible?: () => boolean;
        disabled?: () => boolean;
        subMenus: MenuBarDropDownGroupType[];
        subMenusClassName?: string;
    }

    type MenuBarDropDownCheckItemType = {
        type: 'check';
        name: string | (() => string);
        startIcon?: React.ReactNode;
        endIcon?: React.ReactNode;
        shortCut?: string;
        visible?: () => boolean;
        disabled?: () => boolean;
        checked: () => boolean;
        onCheckedChange: (checked: boolean) => void;
    }

    type MenuBarDropDownRadioItemType = {
        type: 'radio';
        name: string | (() => string);
        startIcon?: React.ReactNode;
        endIcon?: React.ReactNode;
        shortCut?: string;
        visible?: () => boolean;
        disabled?: () => boolean;
        value: () => string;
        onValueChange: (value: string) => void;
        items: {
            name: string;
            value: string;
            visible?: () => boolean;
            disabled?: () => boolean;
        }[];
    }
}

export { }