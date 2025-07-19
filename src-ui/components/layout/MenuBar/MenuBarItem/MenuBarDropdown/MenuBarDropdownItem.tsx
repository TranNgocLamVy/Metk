import { DropdownMenuItem, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger } from "@/components/ui/dropdown-menu";
import MenuBarDropdownGroup from "./MenuBarDropdownGroup";
import { twMerge } from "tailwind-merge";

type MenuBarDropdownItemProps = {
	item: MenuBarDropDownItemType;
};

export function MenuBarDropdownItem({ item }: MenuBarDropdownItemProps) {
	if (item.visible != undefined && !item.visible()) return null;

	const disabled = (item.disabled != undefined && item.disabled()) || false;

	if (item.type === "option") {
		if (item.subMenus) {
			const subMenusClassName = twMerge("w-80", item.subMenusClassName);
			return (
				<DropdownMenuSub>
					<DropdownMenuSubTrigger className="gap-2" disabled={disabled}>
						{item.name}
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent className={subMenusClassName} sideOffset={7} alignOffset={-5}>
						<MenuBarDropdownGroup groups={item.subMenus} />
					</DropdownMenuSubContent>
				</DropdownMenuSub>
			);
		}

		return (
			<DropdownMenuItem className="gap-2" disabled={disabled} onClick={item.onClick}>
				{item.name}
			</DropdownMenuItem>
		);
	}

	if (item.type === "check") {
	}

	if (item.type === "radio") {
	}
}
