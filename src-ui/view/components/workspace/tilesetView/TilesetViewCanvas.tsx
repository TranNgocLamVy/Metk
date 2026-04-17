import { Application } from "pixi.js";

import useResizeObserver from "@/view/hooks/useResizeObserver";
import { useTilesetSessionStore } from "@/view/stores/tilesetSessionStore";
import { Application as PixiApplication } from "@pixi/react";

import ContextMenuWrapper from "../../contextMenu/ContextMenuWrapper";
import { TilesetViewContextMenu } from "./ContextMenu";

export default function TilesetViewCanvas() {
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
		<div ref={containerRef} className="w-full h-full overflow-hidden pt-2">
			<ContextMenuWrapper item={TilesetViewContextMenu}>
				<PixiApplication onInit={onInit} autoStart backgroundAlpha={0} className="bg-canvas shadow-sm" />
			</ContextMenuWrapper>
		</div>
	);
}
