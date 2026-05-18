import { Application } from "pixi.js";

import useResizeObserver from "@/ui/hooks/useResizeObserver";
import { useTilemapSessionStore } from "@/ui/stores/tilemapSessionStore";
import { Application as PixiApplication } from "@pixi/react";

import ContextMenuWrapper from "../../contextMenu/ContextMenuWrapper";
import { TilemapEditorContextMenu } from "./ContextMenu";
import { LocalizedText } from "../../custom/LocalizeText";
import { HStack, VStack } from "../../custom/stack/Stack";
import { Button } from "../../shadcn/button";
import { DialogZLevel } from "@/shared/types/dialog";
import { useDialogStore } from "@/ui/stores/dialogStore";
import { TilemapService } from "@/shared/services/tilemapService";
import { useEffect } from "react";

export default function TilemapEditorCanvas() {
	const { pixiApp, activeSession,  setPixiApp } = useTilemapSessionStore();
	
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
		<div ref={containerRef} className="flex flex-col w-full h-full overflow-hidden px-1 py-2 gap-2 bg-surface">
			<ContextMenuWrapper item={TilemapEditorContextMenu}>
				<PixiApplication onInit={onInit} autoStart backgroundAlpha={0} className="bg-canvas shadow-sm" />
			</ContextMenuWrapper>
			{activeSession == null && <VStack justify="center" align="center" className="absolute w-full h-full top-0 left-0">
				<span className="text-sm">
					<LocalizedText message="workspace.tilemapEditor.empty" />
				</span>
				<HStack className="gap-2">
					<Button variant={"link"} onClick={() => useDialogStore.getState().openDialog("OPEN_FILE_DIALOG", { zLevel: DialogZLevel.Modal }, { panel: "tilemap" })}>
						<LocalizedText message="workspace.tilemapEditor.open" />
					</Button>
					<Button variant={"link"} onClick={TilemapService.createTilemap}>
						<LocalizedText message="workspace.tilemapEditor.create" />
					</Button>
				</HStack>
			</VStack>}
		</div>
	);
}
