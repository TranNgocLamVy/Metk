import { Application } from "pixi.js";

import useResizeObserver from "@/view/hooks/useResizeObserver";
import { useTilemapSessionStore } from "@/view/stores/tilemapSessionStore";
import { Application as PixiApplication } from "@pixi/react";

import ContextMenuWrapper from "../../contextMenu/ContextMenuWrapper";
import { TilemapEditorContextMenu } from "./ContextMenu";

export default function TilemapEditorCanvas() {
	const { pixiApp, setPixiApp } = useTilemapSessionStore();
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
		<div ref={containerRef} className="w-full h-full overflow-hidden px-1 py-2 bg-surface">
			<ContextMenuWrapper item={TilemapEditorContextMenu}>
				<PixiApplication onInit={onInit} autoStart backgroundAlpha={0} className="bg-canvas shadow-sm" />
			</ContextMenuWrapper>
		</div>
	);
}
