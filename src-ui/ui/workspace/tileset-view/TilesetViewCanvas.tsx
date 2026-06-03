import { Application } from "pixi.js";

import useResizeObserver from "@/ui/hooks/useResizeObserver.hook";
import { useTilesetSessionStore } from "@/ui/stores/tileset-session.store";
import { Application as PixiApplication } from "@pixi/react";

import { DialogZLevel } from "@/shared/types/dialog";
import ContextMenuWrapper from "@/ui/components/context-menu/ContextMenuWrapper";
import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { VStack } from "@/ui/components/custom/stack/Stack";
import { Button } from "@/ui/components/shadcn/button";
import { useDialogStore } from "@/ui/stores/dialog.store";
import { useEffect } from "react";
import { TilesetViewContextMenu } from "./ContextMenu";

export default function TilesetViewCanvas() {
	const { pixiApp, activeSession, setPixiApp } = useTilesetSessionStore();

	const containerRef = useResizeObserver<HTMLDivElement>(
		(entry) => {
			if (!pixiApp) return;
			const w = entry.contentRect.width;
			const h = entry.contentRect.height;
			pixiApp.renderer?.resize(w - 1, h + 1);
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
		<div ref={containerRef} className="flex w-full h-full overflow-hidden pt-2 px-frame-quarter relative">
			<ContextMenuWrapper item={TilesetViewContextMenu}>
				<PixiApplication onInit={onInit} autoStart backgroundAlpha={0} className="bg-canvas rounded-md inset-shadow-panel border-t border-foreground/30" />
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
