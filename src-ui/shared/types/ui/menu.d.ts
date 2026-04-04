

declare global {
    type MenuItemType = {
        name: string | (() => string);
        visible?: () => boolean;
        disabled?: () => boolean;
        className?: string;
        groups: MenuDropDownGroupType[];
    }

    type MenuDropDownGroupType = MenuDropDownItemType[] | (() => MenuDropDownItemType[])

    type MenuDropDownItemType = MenuDropDownOptionItemType | MenuDropDownCheckItemType | MenuDropDownRadioItemType | MenuDropDownSubMenuItemType;

    type MenuDropDownOptionItemType = {
        type: 'option';
        name: string | (() => string);
        startIcon?: React.ReactNode;
        endIcon?: React.ReactNode;
        shortCut?: string;
        variant?: "default" | "destructive";
        visible?: () => boolean;
        disabled?: () => boolean;
        onClick: () => void;
    }

    type MenuDropDownSubMenuItemType = {
        type: 'subMenu';
        name: string | (() => string);
        startIcon?: React.ReactNode;
        endIcon?: React.ReactNode;
        shortCut?: string;
        visible?: () => boolean;
        disabled?: () => boolean;
        subMenus: MenuDropDownGroupType[];
        subMenusClassName?: string;
    }

    type MenuDropDownCheckItemType = {
        type: 'check';
        name: string | (() => string);
        startIcon?: React.ReactNode;
        endIcon?: React.ReactNode;
        shortCut?: string;
        visible?: () => boolean;
        disabled?: () => boolean;
        checked: () => boolean;
        toggle: () => void;
    }

    type MenuDropDownRadioItemType = {
        type: 'radio';
        name: string | (() => string);
        startIcon?: React.ReactNode;
        endIcon?: React.ReactNode;
        shortCut?: string;
        visible?: () => boolean;
        disabled?: () => boolean;
        value: () => string;
        onValueChange: (value: any) => void;
        preventDefault?: boolean;
        items: {
            name: string;
            value: string;
            startIcon?: React.ReactNode;
            visible?: () => boolean;
            disabled?: () => boolean;
        }[];
    }
}

export { }