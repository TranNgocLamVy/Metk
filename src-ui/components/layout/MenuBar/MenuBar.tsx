import { Copy, Minus, SunMoon, X } from "lucide-react";

import { HStack } from "@/components/custom/Stack/Stack";
import { useTheme } from "@/components/providers/Theme/ThemeProvider";
import { Button } from "@/components/shadcn/button";
import { getCurrentWindow } from "@tauri-apps/api/window";

import { EditDropdownOptions, FileDropdownOptions, LayerDropdownOptions, MapDropdownOptions, ProjectDropdownOptions, ViewDropdownOptions, WorldDropdownOptions } from "./items";
import { DebugDropdownOptions } from "./items/DebugDropDownOptions";
import MenuBarItem from "./MenuBarItem/MenuBarItem";

export default function MenuBar() {
	const { theme, setTheme } = useTheme();

	const toggleTheme = () => {
		const newTheme = theme === "light" ? "dark" : "light";
		setTheme(newTheme);
	};

	return (
		<HStack id="menu-bar" className="w-full h-fit pb-0.5 overflow-hidden bg-background dark:bg-foreground/5 shadow-md absolute" data-tauri-drag-region>
			<HStack gap={0} className="text-foreground/70">
				<MenuBarItem item={DebugDropdownOptions} />
				<MenuBarItem item={FileDropdownOptions} />
				<MenuBarItem item={EditDropdownOptions} />
				<MenuBarItem item={ViewDropdownOptions} />
				<MenuBarItem item={WorldDropdownOptions} />
				<MenuBarItem item={MapDropdownOptions} />
				<MenuBarItem item={LayerDropdownOptions} />
				<MenuBarItem item={ProjectDropdownOptions} />
				{/* <MenuBarItem item={HelpDropdownOptions} /> */}
			</HStack>

			<HStack gap={0} className="ml-auto">
				<Button title="Change Theme" size={"icon_sm"} variant={"ghost"} className="rounded-none" onClick={toggleTheme}>
					<SunMoon className="size-4" />
				</Button>
				<Button title="Minimize" size={"icon_sm"} variant={"ghost"} className="px-6 rounded-none" onClick={() => getCurrentWindow().minimize()}>
					<Minus className="size-4" />
				</Button>
				<Button title="Toggle Maximize" size={"icon_sm"} variant={"ghost"} className="px-6 rounded-none" onClick={() => getCurrentWindow().toggleMaximize()}>
					<Copy className="size-3" style={{ transform: "scaleX(-1)" }} />
				</Button>
				<Button title="Close" size={"icon_sm"} variant={"pseudo_destructive"} className="px-6 rounded-none" onClick={() => getCurrentWindow().close()}>
					<X className="size-4" />
				</Button>
			</HStack>
		</HStack>
	);
}
