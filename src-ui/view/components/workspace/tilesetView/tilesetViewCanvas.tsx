import { Application } from "pixi.js";

import useResizeObserver from "@/view/hooks/useResizeObserver";
import { useTilesetSessionStore } from "@/view/stores/application/tilesetSessionStore";
import { Application as PixiApplication } from "@pixi/react";

import ContextMenuWrapper from "../../layout/contextMenuWrapper/contextMenuWrapper";
import { TilesetViewContextMenu } from "../../layout/contextMenuWrapper/items/tilesetViewContextMenu";

export default function TilesetViewCanvas() {
	const { pixiApp, setPixiApp } = useTilesetSessionStore();

	const containerRef = useResizeObserver<HTMLDivElement>(
		(entry) => {
			if (!pixiApp) return;
			const w = entry.contentRect.width;
			const h = entry.contentRect.height;
			pixiApp.renderer.resize(w - 2, h - 2);
		},
		[pixiApp]
	);

	const onInit = (pixiApp: Application) => {
		setPixiApp(pixiApp);
	};

	return (
		<div ref={containerRef} className="w-full h-full overflow-hidden p-1 pt-2 bg-secondary-background">
			<ContextMenuWrapper item={TilesetViewContextMenu}>
				<PixiApplication onInit={onInit} autoStart backgroundAlpha={0} className="bg-background rounded-lg border-2" />
			</ContextMenuWrapper>
		</div>
	);
}
