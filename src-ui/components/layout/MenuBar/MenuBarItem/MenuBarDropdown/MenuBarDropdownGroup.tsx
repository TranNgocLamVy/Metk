import { DropdownMenuGroup, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Fragment } from "react/jsx-runtime";
import { MenuBarDropdownItem } from "./MenuBarDropdownItem";

type MenuBarDropdownGroupProps = {
	groups: MenuBarDropDownGroupType[];
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
