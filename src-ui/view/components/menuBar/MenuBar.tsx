import { HStack } from "@/view/components/custom/stack/Stack";
import { useTheme } from "@/view/components/providers/ThemeProvider";
import { FileDropdownOptions } from "./dropdown/FileDropdownOptions";
import { EditDropdownOptions } from "./dropdown/EditDropdownOptions";
import { ViewDropdownOptions } from "./dropdown/ViewDropdownOptions";
import { MapDropdownOptions } from "./dropdown/MapDropdownOptions";
import { LayerDropdownOptions } from "./dropdown/LayerDropdownOptions";
import { ProjectDropdownOptions } from "./dropdown/ProjectDropdownOptions";
import { HelpDropdownOptions } from "./dropdown/HelpDropdownOptions";
import { DebugDropdownOptions } from "./dropdown/DebugDropDownOptions";
import MenuBarItem from "./MenuBarItem";

export default function MenuBar() {
	const { theme, setTheme } = useTheme();

	const toggleTheme = () => {
		const newTheme = theme === "light" ? "dark" : "light";
		setTheme(newTheme);
	};

	return (
		<HStack id="menu-bar" className="w-full h-fit pb-0.5 overflow-hidden bg-background shadow-md fixed top-0 z-50">
			<HStack className="text-foreground/70">
				<MenuBarItem item={FileDropdownOptions} />
				<MenuBarItem item={EditDropdownOptions} />
				<MenuBarItem item={ViewDropdownOptions} />
				<MenuBarItem item={MapDropdownOptions} />
				<MenuBarItem item={LayerDropdownOptions} />
				<MenuBarItem item={ProjectDropdownOptions} />
				<MenuBarItem item={HelpDropdownOptions} />
				<MenuBarItem item={DebugDropdownOptions} />
			</HStack>

			<HStack className="ml-auto">
				{/* <Button title="Change Theme" size={"icon-sm"} variant={"ghost"} className="rounded-none" onClick={toggleTheme}>
					<SunMoon className="size-4" />
				</Button> */}
				{/* <Button title="Minimize" size={"icon-sm"} variant={"ghost"} className="px-6 rounded-none" onClick={() => getCurrentWindow().minimize()}>
					<Minus className="size-4" />
				</Button>
				<Button title="Toggle Maximize" size={"icon-sm"} variant={"ghost"} className="px-6 rounded-none" onClick={() => getCurrentWindow().toggleMaximize()}>
					<Copy className="size-3" style={{ transform: "scaleX(-1)" }} />
				</Button>
				<Button title="Close" size={"icon-sm"} variant={"pseudo_destructive"} className="px-6 rounded-none" onClick={() => getCurrentWindow().close()}>
					<X className="size-4" />
				</Button> */}
			</HStack>
		</HStack>
	);
}
