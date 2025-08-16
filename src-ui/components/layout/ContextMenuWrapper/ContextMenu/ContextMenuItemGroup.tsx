import { Fragment } from "react/jsx-runtime";

import { ContextMenuGroup, ContextMenuSeparator } from "@/components/shadcn/context-menu";

import { ContextMenuItem } from "./ContextMenuItem";

type ContextMenuItemGroupProps = {
	groups: MenuDropDownGroupType[];
};

export default function ContextMenuItemGroup({ groups }: ContextMenuItemGroupProps) {
	return (
		<Fragment>
			{groups.map((group, index) => {
                const items = typeof group === "function" ? group() : group;
				return (
					<Fragment key={index}>
						<ContextMenuGroup>
							{items.map((item, itemIndex) => (
								<ContextMenuItem key={itemIndex} item={item} />
							))}
						</ContextMenuGroup>
						{index < groups.length - 1 && <ContextMenuSeparator />}
					</Fragment>
				);
			})}
		</Fragment>
	);
}
