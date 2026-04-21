import { Application } from "pixi.js";

import useResizeObserver from "@/view/hooks/useResizeObserver";
import { useTilesetSessionStore } from "@/view/stores/tilesetSessionStore";
import { Application as PixiApplication } from "@pixi/react";

import ContextMenuWrapper from "../../contextMenu/ContextMenuWrapper";
import { TilesetViewContextMenu } from "./ContextMenu";
import { useTranslation } from "react-i18next";
import { useMemo } from "react";
import { VStack } from "../../custom/stack/Stack";
import { Button } from "../../shadcn/button";
import { DialogZLevel } from "@/shared/types/dialog";
import { useDialogStore } from "@/view/stores/dialogStore";

export default function TilesetViewCanvas() {
	const { t: translate } = useTranslation([]);

	const { version, getCurrentTilesetSessionId } = useTilesetSessionStore();
	const currentTilesetSessionId = useMemo(() => getCurrentTilesetSessionId(), [version]);

	const { pixiApp, setPixiApp } = useTilesetSessionStore();

	const containerRef = useResizeObserver<HTMLDivElement>(
		(entry) => {
			if (!pixiApp) return;
			const w = entry.contentRect.width;
			const h = entry.contentRect.height;
			pixiApp.renderer?.resize(w, h);
		},
		[pixiApp]
	);

	const onInit = (pixiApp: Application) => {
		setPixiApp(pixiApp);
	};

	return (
		<div ref={containerRef} className="w-full h-full overflow-hidden pt-2 relative">
			<ContextMenuWrapper item={TilesetViewContextMenu}>
				<PixiApplication onInit={onInit} autoStart backgroundAlpha={0} className="bg-canvas shadow-sm" />
			</ContextMenuWrapper>
			{currentTilesetSessionId == null && <VStack justify="center" align="center" className="absolute w-full h-full top-0 left-0 pr-2">
				<span className="text-sm">
					{translate("workspace.tilesetSelector.empty")}
				</span>
				<Button variant={"link"} onClick={() => useDialogStore.getState().openDialog("OPEN_FILE_DIALOG", { zLevel: DialogZLevel.Modal }, { panel: "tileset" })}>
					{translate("workspace.tilesetSelector.open")}
				</Button>
			</VStack>}
		</div>
	);
}
