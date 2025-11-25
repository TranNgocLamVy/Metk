// useGlobalListeners.ts
import { useEffect } from "react";

let isRegistered = false;

export function usePreventContextMenu() {
	useEffect(() => {
		if (isRegistered) return;
		isRegistered = true;
		const handleContextMenu = (e: MouseEvent) => e.preventDefault();
		document.addEventListener("contextmenu", handleContextMenu);
	}, []);
}
