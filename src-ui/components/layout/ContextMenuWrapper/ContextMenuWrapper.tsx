import { ContextMenu, ContextMenuContent, ContextMenuTrigger } from "@/components/shadcn/context-menu";
import { usePreventContextMenu } from "@/hooks/usePreventContextMenu/usePreventContextMenu";
import ContextMenuItemGroup from "./ContextMenu/ContextMenuItemGroup";
import { twMerge } from "tailwind-merge";

interface ContextMenuWrapperProps {
	item: MenuItemType;
	children: React.ReactNode;
}

export default function ContextMenuWrapper({ item, children }: ContextMenuWrapperProps) {
	usePreventContextMenu();

    const className = twMerge("w-40", item.className);
	return (
		<ContextMenu modal={false}>
			<ContextMenuTrigger className="w-full h-full">
				{children}
			</ContextMenuTrigger>
            <ContextMenuContent className={className}>
				<ContextMenuItemGroup groups={item.groups} />
			</ContextMenuContent>
		</ContextMenu>
	);
}
