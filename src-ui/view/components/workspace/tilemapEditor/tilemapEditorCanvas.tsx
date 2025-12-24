import { Application } from "pixi.js";

import useResizeObserver from "@/view/hooks/useResizeObserver";
import { useTilemapSessionStore } from "@/view/stores/application/tilemapSessionStore";
import { Application as PixiApplication } from "@pixi/react";

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
		<div ref={containerRef} className="bg-secondary-background/40 w-full h-full overflow-hidden rounded-lg">
			<PixiApplication onInit={onInit} autoStart backgroundAlpha={0} />
		</div>
	);
}
