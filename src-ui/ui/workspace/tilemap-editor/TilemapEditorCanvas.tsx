import { Application } from "pixi.js";

import useResizeObserver from "@/ui/hooks/useResizeObserver.hook";
import { useTilemapSessionStore } from "@/ui/stores/tilemap-session.store";
import { Application as PixiApplication } from "@pixi/react";

import { TilemapService } from "@/shared/services/tilemap.service";
import { DialogZLevel } from "@/shared/types/dialog";
import ContextMenuWrapper from "@/ui/components/context-menu/ContextMenuWrapper";
import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { HStack, VStack } from "@/ui/components/custom/stack/Stack";
import { Button } from "@/ui/components/shadcn/button";
import { useDialogStore } from "@/ui/stores/dialog.store";
import { useEffect } from "react";
import { TilemapEditorContextMenu } from "./ContextMenu";

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
		<div ref={containerRef} className="flex flex-col w-full h-full overflow-hidden pb-frame-quarter bg-surface">
			<ContextMenuWrapper item={TilemapEditorContextMenu}>
				<PixiApplication onInit={onInit} autoStart backgroundAlpha={0} className="bg-canvas rounded-md inset-shadow-panel border-t border-foreground/30" />
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
