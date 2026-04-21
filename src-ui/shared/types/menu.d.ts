

declare global {
    type MenuItemType = {
        label: string | (() => string);
        visible?: () => boolean;
        disabled?: () => boolean;
        className?: string;
        groups: MenuDropDownGroupType[];
    }

    type MenuDropDownGroupType = MenuDropDownItemType[] | (() => MenuDropDownItemType[])

    type MenuDropDownItemType = MenuDropDownOptionItemType | MenuDropDownCheckItemType | MenuDropDownRadioItemType | MenuDropDownSubMenuItemType;

    type MenuDropDownOptionItemType = {
        type: 'option';
        label: string | (() => string);
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
        label: string | (() => string);
        startIcon?: React.ReactNode;
        endIcon?: React.ReactNode;
        shortCut?: string;
        visible?: () => boolean;
        disabled?: () => boolean;
        subMenus: MenuDropDownGroupType[] | (() => MenuDropDownGroupType[]);
        subMenusClassName?: string;
    }

    type MenuDropDownCheckItemType = {
        type: 'check';
        label: string | (() => string);
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
        label: string | (() => string);
        startIcon?: React.ReactNode;
        endIcon?: React.ReactNode;
        shortCut?: string;
        visible?: () => boolean;
        disabled?: () => boolean;
        value: () => string;
        onValueChange: (value: any) => void;
        preventDefault?: boolean;
        items: {
            label: string;
            value: string;
            startIcon?: React.ReactNode;
            visible?: () => boolean;
            disabled?: () => boolean;
        }[];
    }
}

export { }