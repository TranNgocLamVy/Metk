import { Fragment, useEffect, useReducer, useState } from "react";
import { useTranslation } from "react-i18next";
import { twMerge } from "tailwind-merge";

import { Button } from "@/view/components/shadcn/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from "@/view/components/shadcn/dropdown-menu";


interface MenuBarItemProps {
	item: MenuItemType;
}
export default function MenuBarItem({ item }: MenuBarItemProps) {
    const [isOpen, setIsOpen] = useState(false);

    const { t: translate } = useTranslation(['common', 'menuBar']);

    useEffect(() => {
        const onWindowLoseFocus = () => setIsOpen(false);
        window.addEventListener("blur", onWindowLoseFocus);
        return () => window.removeEventListener("blur", onWindowLoseFocus);
    }, [])

	if (item.visible != undefined && !item.visible()) return null;

	const disabled = (item.disabled != undefined && item.disabled()) || false;
    const name = typeof item.name === "function" ? item.name() : item.name;
	const className = twMerge("w-96 bg-surface-overlay shadow-lg", item.className);

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
			<DropdownMenuTrigger disabled={disabled} asChild>
				<Button size={"sm"} variant={"empty"} className="px-2 rounded-none h-8 hover:bg-surface-sunken" asChild>
					<p className="text-xs">{translate(name)}</p>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className={className} side="bottom" align="start" sideOffset={0} >
				<MenuBarDropdownGroup groups={item.groups} />
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

type MenuBarDropdownGroupProps = {
	groups: MenuDropDownGroupType[];
};

function MenuBarDropdownGroup({ groups }: MenuBarDropdownGroupProps) {
	return (
		<Fragment>
			{groups.map((group, index) => {
                const items = typeof group === "function" ? group() : group;
				return (
					<Fragment key={index}>
						<DropdownMenuGroup>
							{items.map((item, itemIndex) => (
								<MenuBarDropdownItem key={itemIndex} item={item} />
							))}
						</DropdownMenuGroup>
						{index < groups.length - 1 && <DropdownMenuSeparator />}
					</Fragment>
				);
			})}
		</Fragment>
	);
}

type MenuBarDropdownItemProps = {
	item: MenuDropDownItemType;
};

function MenuBarDropdownItem({ item }: MenuBarDropdownItemProps) {
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
			<DropdownMenuItem className="gap-2 h-7 text-xs" disabled={disabled} onClick={item.onClick}>
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
				<DropdownMenuSubTrigger className="gap-2 h-7 text-xs" disabled={disabled}>
					{wrapIcon(item.startIcon)}
					{name}
					{wrapIcon(item.endIcon, false)}
				</DropdownMenuSubTrigger>
				<DropdownMenuSubContent className={subMenusClassName} sideOffset={0}>
					<MenuBarDropdownGroup groups={item.subMenus} />
				</DropdownMenuSubContent>
			</DropdownMenuSub>
		);
	}

	if (item.type === "check") {
		return (
			<DropdownMenuCheckboxItem className="gap-2 h-7 text-xs" checked={item.checked()} disabled={disabled} onSelect={(e) => {
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
						<DropdownMenuRadioItem onSelect={(e) => e.preventDefault()} className="gap-2 h-7 text-xs" key={radioItem.value} value={radioItem.value} disabled={disabled}>
							{wrapIcon(radioItem.startIcon, false)}
							{radioItem.name}
						</DropdownMenuRadioItem>
					);
				})}
			</DropdownMenuRadioGroup>
		);
	}
}
