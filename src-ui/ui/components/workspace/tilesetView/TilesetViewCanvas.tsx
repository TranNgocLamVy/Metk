import { Application } from "pixi.js";

import useResizeObserver from "@/ui/hooks/useResizeObserver";
import { useTilesetSessionStore } from "@/ui/stores/tilesetSessionStore";
import { Application as PixiApplication } from "@pixi/react";

import ContextMenuWrapper from "../../contextMenu/ContextMenuWrapper";
import { TilesetViewContextMenu } from "./ContextMenu";
import { LocalizedText } from "../../custom/LocalizeText";
import { VStack } from "../../custom/stack/Stack";
import { Button } from "../../shadcn/button";
import { DialogZLevel } from "@/shared/types/dialog";
import { useDialogStore } from "@/ui/stores/dialogStore";
import { useEffect } from "react";

export default function TilesetViewCanvas() {
	const { pixiApp, activeSession, setPixiApp } = useTilesetSessionStore();

	const containerRef = useResizeObserver<HTMLDivElement>(
		(entry) => {
			if (!pixiApp) return;
			const w = entry.contentRect.width;
			const h = entry.contentRect.height;
			pixiApp.renderer?.resize(w, h);
		},
		[pixiApp]
	);

	useEffect(() => {
		if (!pixiApp) return;
		return () => {
			setPixiApp(null!);
		}
	}, [pixiApp])

	const onInit = (pixiApp: Application) => {
		setPixiApp(pixiApp);
	};

	return (
		<div ref={containerRef} className="w-full h-full overflow-hidden pt-2 relative">
			<ContextMenuWrapper item={TilesetViewContextMenu}>
				<PixiApplication onInit={onInit} autoStart backgroundAlpha={0} className="bg-canvas shadow-sm" />
			</ContextMenuWrapper>
			{activeSession == null && <VStack justify="center" align="center" className="absolute w-full h-full top-0 left-0 pr-2">
				<span className="text-sm">
					<LocalizedText message="workspace.tilesetSelector.empty" />
				</span>
				<Button variant={"link"} onClick={() => useDialogStore.getState().openDialog("OPEN_FILE_DIALOG", { zLevel: DialogZLevel.Modal }, { panel: "tileset" })}>
					<LocalizedText message="workspace.tilesetSelector.open" />
				</Button>
			</VStack>}
		</div>
	);
}
