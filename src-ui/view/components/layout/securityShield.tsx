import { useEffect, useRef } from "react";

import { KeyUtils } from "@/shared/utils/keyUtils";

export default function SecurityShield() {
	useEffect(() => {
        const disableKeybind = process.env.NODE_ENV != "development" ? disableKeyBindProduction : disableKeyBindDevelopment;

		const handleContextMenu = (e: any) => {
			e.preventDefault();
		};

		const handleKeyDown = (e: KeyboardEvent) => {
			const keybind = KeyUtils.getKeystrokeString(e);
			if (disableKeybind.includes(keybind)) {
				e.preventDefault();
				return false;
			} else if (e.key == "Tab") {
                e.preventDefault();
				return false;
            }
		};

		const disableConsole = () => {
            if (process.env.NODE_ENV == "development") return;
			const noop = () => {};
			window.console.log = noop;
			window.console.info = noop;
			window.console.warn = noop;
			window.console.error = noop;
			window.console.debug = noop;
		};

		disableConsole();
		window.addEventListener("contextmenu", handleContextMenu);
		window.addEventListener("keydown", handleKeyDown);

		return () => {
			window.removeEventListener("contextmenu", handleContextMenu);
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, []);

	const isF5Pressed = useRef(false);

useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "F5") {
            isF5Pressed.current = true;
        }
    };

    const handleBeforeUnload = (e: any) => {
        if (isF5Pressed.current) {
            e.preventDefault();
            e.returnValue = "";
            setTimeout(() => {
                isF5Pressed.current = false;
            }, 100);
        }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("beforeunload", handleBeforeUnload);
    };
}, []);

	return null;
}

const disableKeyBindProduction = [
	"F1",
	"F2",
	"F3",
	"F4",
	"F5",
	"F6",
	"F7",
	"F8",
	"F9",
	"F10",
	"F11",
	"F12",
	"Ctrl+P", // Print
	"Ctrl+R", // Reload
	"Ctrl+U", // View source
	"Ctrl+G", // Find
	"Ctrl+F", // Search
	"Ctrl+J", // Downloads
	"Ctrl+Shift+P", // Print
	"Ctrl+Shift+R", // Reload
	"Ctrl+Shift+I", // Dev tool
	"Ctrl+Shift+G", // Find
	"Ctrl+Shift+F", // Search
	"Ctrl+Shift+J", // Dev tool
	"Ctrl+Shift+C", // Dev tool
];

const disableKeyBindDevelopment = [
	"Ctrl+P", // Print
	"Ctrl+U", // View source
	"Ctrl+G", // Find
	"Ctrl+F", // Search
	"Ctrl+J", // Downloads
	"Ctrl+Shift+P", // Print
	"Ctrl+Shift+I", // Dev tool
	"Ctrl+Shift+G", // Find
	"Ctrl+Shift+F", // Search
	"Ctrl+Shift+J", // Dev tool
	"Ctrl+Shift+C", // Dev tool
];
