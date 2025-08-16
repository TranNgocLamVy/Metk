import { useReducer } from "react";
import { twMerge } from "tailwind-merge";

import { DropdownMenuCheckboxItem, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@/components/shadcn/dropdown-menu";

import MenuBarDropdownGroup from "./MenuBarDropdownGroup";

type MenuBarDropdownItemProps = {
	item: MenuDropDownItemType;
};

export function MenuBarDropdownItem({ item }: MenuBarDropdownItemProps) {
    const [, forceUpdate] = useReducer(x => x + 1, 0)

	if (item.visible != undefined && !item.visible()) return null;

	const disabled = (item.disabled != undefined && item.disabled()) || false;
	const name = typeof item.name === "function" ? item.name() : item.name;

	const wrapIcon = (icon: React.ReactNode, placeholder: boolean = true) => {
		if (!placeholder && !icon) return null;

		return (
			<svg className="size-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<g>{icon ? icon : null}</g>
			</svg>
		);
	};

	if (item.type === "option") {
		return (
			<DropdownMenuItem className="gap-2 h-dropdown-menu text-dropdown-menu" disabled={disabled} onClick={item.onClick}>
				{wrapIcon(item.startIcon)}
				{name}
				{wrapIcon(item.endIcon, false)}
				<DropdownMenuShortcut>{item.shortCut ? item.shortCut : null}</DropdownMenuShortcut>
				{wrapIcon(null, item.shortCut ? false : true)}
			</DropdownMenuItem>
		);
	}

	if (item.type === "subMenu") {
		const subMenusClassName = twMerge("w-70", item.subMenusClassName);
		return (
			<DropdownMenuSub>
				<DropdownMenuSubTrigger className="gap-2 h-dropdown-menu text-dropdown-menu" disabled={disabled}>
					{wrapIcon(item.startIcon)}
					{name}
					{wrapIcon(item.endIcon, false)}
				</DropdownMenuSubTrigger>
				<DropdownMenuSubContent className={subMenusClassName} sideOffset={7} alignOffset={-5}>
					<MenuBarDropdownGroup groups={item.subMenus} />
				</DropdownMenuSubContent>
			</DropdownMenuSub>
		);
	}

	if (item.type === "check") {
		return (
			<DropdownMenuCheckboxItem className="gap-2 h-dropdown-menu text-dropdown-menu" checked={item.checked()} disabled={disabled} onSelect={(e) => {
                e.preventDefault();
                item.toggle();
            }}>
				{wrapIcon(item.startIcon, false)}
				{name}
				{wrapIcon(item.endIcon, false)}
				<DropdownMenuShortcut>{item.shortCut ? item.shortCut : null}</DropdownMenuShortcut>
				{wrapIcon(null, item.shortCut ? false : true)}
			</DropdownMenuCheckboxItem>
		);
	}

	if (item.type === "radio") {
		return (
			<DropdownMenuRadioGroup value={item.value()} onValueChange={item.onValueChange}>
				{item.items.map((radioItem) => {
					const disabled = (radioItem.disabled != undefined && radioItem.disabled()) || false;
					return (
						<DropdownMenuRadioItem onSelect={(e) => e.preventDefault()} className="gap-2 h-dropdown-menu text-dropdown-menu" key={radioItem.value} value={radioItem.value} disabled={disabled}>
							{wrapIcon(radioItem.startIcon, false)}
							{radioItem.name}
						</DropdownMenuRadioItem>
					);
				})}
			</DropdownMenuRadioGroup>
		);
	}
}
