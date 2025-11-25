import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

import { Button } from "@/view/components/shadcn/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/view/components/shadcn/dropdown-menu";

import MenuBarDropdownGroup from "./menuBarDropdown/menuBarDropdownGroup";

interface MenuBarItemProps {
	item: MenuItemType;
}
export default function MenuBarItem({ item }: MenuBarItemProps) {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const onWindowLoseFocus = () => setIsOpen(false);
        window.addEventListener("blur", onWindowLoseFocus);
        return () => window.removeEventListener("blur", onWindowLoseFocus);
    }, [])

	if (item.visible != undefined && !item.visible()) return null;

	const disabled = (item.disabled != undefined && item.disabled()) || false;
    const name = typeof item.name === "function" ? item.name() : item.name;
	const className = twMerge("w-96", item.className);

	return (
		<DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
			<DropdownMenuTrigger disabled={disabled}>
				<Button size={"sm"} variant={"ghost"} className="px-2 rounded-none" asChild>
					<p className="text-xs">{name}</p>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className={className} side="bottom" align="start" >
				<MenuBarDropdownGroup groups={item.groups} />
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
