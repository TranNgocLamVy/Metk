import { twMerge } from "tailwind-merge";

import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "@/view/components/shadcn/context-menu";
import ContextMenuItemGroup from "./ContextMenuItemGroup";


interface ContextMenuWrapperProps {
	item: MenuItemType;
	children: React.ReactNode;
}

export default function ContextMenuWrapper({ item, children }: ContextMenuWrapperProps) {
    const className = twMerge("w-40 bg-secondary-background", item.className);
	return (
		<ContextMenu modal={true}>
			<ContextMenuTrigger className="w-full h-full">
				{children}
			</ContextMenuTrigger>
            <ContextMenuContent className={className}>
				<ContextMenuItemGroup groups={item.groups} />
			</ContextMenuContent>
		</ContextMenu>
	);
}
