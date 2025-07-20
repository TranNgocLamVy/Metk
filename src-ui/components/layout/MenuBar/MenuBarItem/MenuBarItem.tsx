import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import MenuBarDropdownGroup from "./MenuBarDropdown/MenuBarDropdownGroup";

interface MenuBarItemProps {
	item: MenuBarItemType;
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
				<Button size={"sm"} variant={"ghost"} className="px-4 rounded-none" asChild>
					<p>{name}</p>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className={className} side="bottom" align="start">
				<MenuBarDropdownGroup groups={item.groups} />
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
