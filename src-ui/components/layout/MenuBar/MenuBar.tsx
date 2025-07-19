import { getCurrentWindow } from "@tauri-apps/api/window";
import { Minus, Copy, X, SunMoon } from "lucide-react";
import { HStack } from "@/components/custom/Stack/Stack";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/Theme/ThemeProvider";
import MenuBarItem from "./MenuBarItem/MenuBarItem";
import { EditDropdownOptions, FileDropdownOptions, HelpDropdownOptions } from "./items";

export default function MenuBar() {
	const { theme, setTheme } = useTheme();

	const toggleTheme = () => {
		const newTheme = theme === "light" ? "dark" : "light";
		setTheme(newTheme);
	};

	return (
		<HStack className="w-full h-fit pb-0.5 overflow-hidden bg-accent-foreground/10 dark:bg-foreground/5 shadow-md" data-tauri-drag-region>
			<HStack gap={0} className="text-foreground/70">
				<MenuBarItem item={FileDropdownOptions} />
				<MenuBarItem item={EditDropdownOptions} />
				<MenuBarItem item={HelpDropdownOptions} />
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
