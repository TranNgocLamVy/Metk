import { Application } from "pixi.js";
import { useEffect, useState } from "react";

import useResizeObserver from "@/view/hooks/useResizeObserver";
import { useTilesetViewStore } from "@/view/stores/application/tilesetViewStore";
import { Application as PixiApplication } from "@pixi/react";

export default function TilesetViewCanvas() {
    const [pixiApp, setPixiApp] = useState<Application | null>(null);
    
	const { currentTilesetViewSession } = useTilesetViewStore();
    useEffect(() => {
		if (!currentTilesetViewSession || !pixiApp) return;
        pixiApp.stage.removeChildren();
        currentTilesetViewSession.activateSession(pixiApp);
	}, [currentTilesetViewSession, pixiApp]);
    
    const containerRef = useResizeObserver<HTMLDivElement>((entry) => {
        if (!pixiApp) return;
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        pixiApp.renderer.resize(w, h);
    }, [pixiApp]);

	return (
		<div ref={containerRef} className="bg-secondary-background w-full h-full overflow-hidden">
			<PixiApplication resizeTo={containerRef} onInit={setPixiApp} autoStart backgroundAlpha={0} />
		</div>
	);
}
