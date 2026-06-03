import { twMerge } from "tailwind-merge";

import { ContextMenuCheckboxItem, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuItem as ShadContextMenuItem } from "@/ui/components/shadcn/context-menu";

import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import MenuBarDropdownGroup from "./ContextMenuItemGroup";

type ContextMenuItemProps = {
	item: MenuDropDownItemType;
};

export function ContextMenuItem({ item }: ContextMenuItemProps) {

	if (item.visible != undefined && !item.visible()) return null;

	const disabled = (item.disabled != undefined && item.disabled()) || false;
	const label = typeof item.label === "function" ? item.label() : item.label

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
			<ShadContextMenuItem variant={item.variant} className="gap-2 h-6 text-xs" disabled={disabled} onClick={disabled ? undefined : item.onClick}>
				{wrapIcon(item.startIcon)}
				<LocalizedText message={label} />
				{wrapIcon(item.endIcon, false)}
				<ContextMenuShortcut>{item.shortCut ? item.shortCut : null}</ContextMenuShortcut>
				{wrapIcon(null, item.shortCut ? false : true)}
			</ShadContextMenuItem>
		);
	}

	if (item.type === "subMenu") {
		const subMenusClassName = twMerge("w-70 bg-surface border-0", item.subMenusClassName);
		const subMenus = typeof item.subMenus === "function" ? item.subMenus() : item.subMenus;
		return (
			<ContextMenuSub>
				<ContextMenuSubTrigger className="gap-2 h-6 text-xs" disabled={disabled}>
					{wrapIcon(item.startIcon)}
					<LocalizedText message={label} />
					{wrapIcon(item.endIcon, false)}
				</ContextMenuSubTrigger>
				<ContextMenuSubContent className={subMenusClassName} sideOffset={4} alignOffset={-1}>
					<MenuBarDropdownGroup groups={subMenus} />
				</ContextMenuSubContent>
			</ContextMenuSub>
		);
	}

	if (item.type === "check") {
		return (
			<ContextMenuCheckboxItem className="gap-2 h-6 text-xs" checked={item.checked()} onCheckedChange={item.toggle} disabled={disabled} >
				{wrapIcon(item.startIcon, false)}
				<LocalizedText message={label} />
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
						<ContextMenuRadioItem className="gap-2 h-6 text-xs" key={radioItem.value} onSelect={(e) => {if(item.preventDefault) e.preventDefault()}} value={radioItem.value} disabled={disabled}>
							{wrapIcon(radioItem.startIcon, false)}
							<LocalizedText message={radioItem.label} />
						</ContextMenuRadioItem>
					);
				})}
			</ContextMenuRadioGroup>
		);
	}
}
