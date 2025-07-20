import { DropdownMenuCheckboxItem, DropdownMenuItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@/components/ui/dropdown-menu";
import MenuBarDropdownGroup from "./MenuBarDropdownGroup";
import { twMerge } from "tailwind-merge";

type MenuBarDropdownItemProps = {
	item: MenuBarDropDownItemType;
};

export function MenuBarDropdownItem({ item }: MenuBarDropdownItemProps) {
	if (item.visible != undefined && !item.visible()) return null;

	const disabled = (item.disabled != undefined && item.disabled()) || false;
    const name = typeof item.name === "function" ? item.name() : item.name;

	const wrapIcon = (icon: React.ReactNode) => {
		return (
			<svg className="size-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
				<g>{icon ? icon : null}</g>
			</svg>
		);
	};

	if (item.type === "option") {
		return (
			<DropdownMenuItem className="gap-2" disabled={disabled} onClick={item.onClick}>
				{wrapIcon(item.startIcon)}
				{name}
				{wrapIcon(item.endIcon)}
				<DropdownMenuShortcut>{item.shortCut ? item.shortCut : null}</DropdownMenuShortcut>
                {wrapIcon(null)}
			</DropdownMenuItem>
		);
	}

    if (item.type === "subMenu") {
			const subMenusClassName = twMerge("w-70", item.subMenusClassName);
			return (
				<DropdownMenuSub>
					<DropdownMenuSubTrigger className="gap-2" disabled={disabled}>
						{wrapIcon(item.startIcon)}
						{name}
						{wrapIcon(item.endIcon)}
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent className={subMenusClassName} sideOffset={7} alignOffset={-5}>
						<MenuBarDropdownGroup groups={item.subMenus} />
					</DropdownMenuSubContent>
				</DropdownMenuSub>
			);
		}

	if (item.type === "check") {
		return (
			<DropdownMenuCheckboxItem checked={item.checked()} onCheckedChange={item.onCheckedChange} disabled={disabled} className="gap-2">
				{name}
				{wrapIcon(item.endIcon)}
				<DropdownMenuShortcut>{item.shortCut ? item.shortCut : null}</DropdownMenuShortcut>
                {wrapIcon(null)}
			</DropdownMenuCheckboxItem>
		);
	}

	if (item.type === "radio") {
		return (
			<DropdownMenuRadioGroup value={item.value()} onValueChange={item.onValueChange}>
				{item.items.map((radioItem) => {
					const disabled = (radioItem.disabled != undefined && radioItem.disabled()) || false;
					return (
						<DropdownMenuRadioItem key={radioItem.value} value={radioItem.value} disabled={disabled} className="gap-2">
							{radioItem.name}
							{wrapIcon(item.endIcon)}
							<DropdownMenuShortcut>{item.shortCut ? item.shortCut : null}</DropdownMenuShortcut>
							{wrapIcon(null)}
						</DropdownMenuRadioItem>
					);
				})}
			</DropdownMenuRadioGroup>
		);
	}
}
