import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuPortal, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import MenuBarDropdownGroup from "./MenuBarDropdown/MenuBarDropdownGroup";
import { twMerge } from "tailwind-merge";

interface MenuBarItemProps {
	item: MenuBarItemType;
}
export default function MenuBarItem({ item }: MenuBarItemProps) {
	if (item.visible != undefined && !item.visible()) return null;

	const disabled = (item.disabled != undefined && item.disabled()) || false;
	const className = twMerge("w-96", item.className);

	return (
		<DropdownMenu>
			<DropdownMenuTrigger disabled={disabled}>
				<Button size={"sm"} variant={"ghost"} className="px-4 rounded-none" asChild>
					<p>{item.name}</p>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuPortal>
				<DropdownMenuContent className={className} side="bottom" align="start">
					<MenuBarDropdownGroup groups={item.groups} />
				</DropdownMenuContent>
			</DropdownMenuPortal>
		</DropdownMenu>
	);
}
