import { Application } from "pixi.js";

import useResizeObserver from "@/view/hooks/useResizeObserver";
import { useTilemapSessionStore } from "@/view/stores/application/tilemapSessionStore";
import { Application as PixiApplication } from "@pixi/react";

import ContextMenuWrapper from "../../layout/contextMenuWrapper/contextMenuWrapper";
import { TilemapEditorContextMenu } from "../../layout/contextMenuWrapper/items/tilemapEditorContextMenu";

export default function TilemapEditorCanvas() {
	const { pixiApp, setPixiApp } = useTilemapSessionStore();
	const containerRef = useResizeObserver<HTMLDivElement>(
		(entry) => {
			if (!pixiApp) return;
			const w = entry.contentRect.width;
			const h = entry.contentRect.height;
			pixiApp.renderer.resize(w, h);
		},
		[pixiApp]
	);

	const onInit = (pixiApp: Application) => {
		setPixiApp(pixiApp);
	};

	return (
		<div ref={containerRef} className="bg-secondary-background w-full h-full overflow-hidden pl-1 pr-1.5 pt-2 pb-3">
			<ContextMenuWrapper item={TilemapEditorContextMenu}>
				<PixiApplication onInit={onInit} autoStart backgroundAlpha={0} className="rounded-lg bg-background border-2 shadow-sm" />
			</ContextMenuWrapper>
		</div>
	);
}
