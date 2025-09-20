import { twMerge } from "tailwind-merge";

import { ContextMenuCheckboxItem, ContextMenuItem as ShadContextMenuItem, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger } from "@/components/shadcn/context-menu";

import MenuBarDropdownGroup from "./contextMenuItemGroup";

type ContextMenuItemProps = {
	item: MenuDropDownItemType;
};

export function ContextMenuItem({ item }: ContextMenuItemProps) {
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
			<ShadContextMenuItem className="gap-2 h-6 text-xs" disabled={disabled} onClick={item.onClick}>
				{wrapIcon(item.startIcon)}
				{name}
				{wrapIcon(item.endIcon, false)}
				<ContextMenuShortcut>{item.shortCut ? item.shortCut : null}</ContextMenuShortcut>
				{wrapIcon(null, item.shortCut ? false : true)}
			</ShadContextMenuItem>
		);
	}

	if (item.type === "subMenu") {
		const subMenusClassName = twMerge("w-70", item.subMenusClassName);
		return (
			<ContextMenuSub>
				<ContextMenuSubTrigger className="gap-2 h-6 text-xs" disabled={disabled}>
					{wrapIcon(item.startIcon)}
					{name}
					{wrapIcon(item.endIcon, false)}
				</ContextMenuSubTrigger>
				<ContextMenuSubContent className={subMenusClassName} sideOffset={7} alignOffset={-5}>
					<MenuBarDropdownGroup groups={item.subMenus} />
				</ContextMenuSubContent>
			</ContextMenuSub>
		);
	}

	if (item.type === "check") {
		return (
			<ContextMenuCheckboxItem className="gap-2 h-6 text-xs" onSelect={(e) => e.preventDefault()} checked={item.checked()} onCheckedChange={item.toggle} disabled={disabled}>
				{wrapIcon(item.startIcon, false)}
				{name}
				{wrapIcon(item.endIcon, false)}
				<ContextMenuShortcut>{item.shortCut ? item.shortCut : null}</ContextMenuShortcut>
				{wrapIcon(null, item.shortCut ? false : true)}
			</ContextMenuCheckboxItem>
		);
	}

	if (item.type === "radio") {
		return (
			<ContextMenuRadioGroup value={item.value()} onValueChange={item.onValueChange}>
				{item.items.map((radioItem) => {
					const disabled = (radioItem.disabled != undefined && radioItem.disabled()) || false;
					return (
						<ContextMenuRadioItem className="gap-2 h-6 text-xs" key={radioItem.value} onSelect={(e) => e.preventDefault()} value={radioItem.value} disabled={disabled}>
							{wrapIcon(radioItem.startIcon, false)}
							{radioItem.name}
						</ContextMenuRadioItem>
					);
				})}
			</ContextMenuRadioGroup>
		);
	}
}
