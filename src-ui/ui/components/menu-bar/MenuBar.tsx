import { useTheme } from "@/app/providers/theme.provider";
import { HStack } from "@/ui/components/custom/stack/Stack";
import { Button } from '@/ui/components/shadcn/button';
import { SunMoon } from "lucide-react";
import { DebugDropdownOptions } from "./dropdown/DebugDropDownOptions";
import { EditDropdownOptions } from "./dropdown/EditDropdownOptions";
import { FileDropdownOptions } from "./dropdown/FileDropdownOptions";
import { HelpDropdownOptions } from "./dropdown/HelpDropdownOptions";
import { LayerDropdownOptions } from "./dropdown/LayerDropdownOptions";
import { MapDropdownOptions } from "./dropdown/MapDropdownOptions";
import { ViewDropdownOptions } from "./dropdown/ViewDropdownOptions";
import MenuBarItem from "./MenuBarItem";

export default function MenuBar() {
	const { theme, setTheme } = useTheme();

	const toggleTheme = () => {
		const newTheme = theme === "light" ? "dark" : "light";
		setTheme(newTheme);
	};

	return (
		<HStack id="menu-bar" className="w-full h-fit bg-surface-base fixed top-0">
			<HStack className="text-foreground/70 h-fit">
				<MenuBarItem item={FileDropdownOptions} />
				<MenuBarItem item={EditDropdownOptions} />
				<MenuBarItem item={ViewDropdownOptions} />
				<MenuBarItem item={MapDropdownOptions} />
				<MenuBarItem item={LayerDropdownOptions} />
				{/* <MenuBarItem item={ProjectDropdownOptions} /> */}
				<MenuBarItem item={HelpDropdownOptions} />
				<MenuBarItem item={DebugDropdownOptions} />
			</HStack>

			<HStack className="ml-auto">
				<Button title="Change Theme" size={"icon-xs"} variant={"ghost"} className="rounded-none" onClick={toggleTheme}>
					<SunMoon />
				</Button>
			</HStack>
		</HStack>
	);
}
