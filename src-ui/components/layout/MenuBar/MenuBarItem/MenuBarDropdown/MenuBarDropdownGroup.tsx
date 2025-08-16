import { Fragment } from "react/jsx-runtime";

import { DropdownMenuGroup, DropdownMenuSeparator } from "@/components/shadcn/dropdown-menu";

import { MenuBarDropdownItem } from "./MenuBarDropdownItem";

type MenuBarDropdownGroupProps = {
	groups: MenuDropDownGroupType[];
};

export default function MenuBarDropdownGroup({ groups }: MenuBarDropdownGroupProps) {
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
