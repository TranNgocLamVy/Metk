import { Application } from "pixi.js";
import { useEffect, useRef, useState } from "react";

import useResizeObserver from "@/view/hooks/useResizeObserver";
import { tilesetRenderManager } from "@/view/manager/tilesetRenderManager";
import { TilesetSessionView } from "@/view/manager/tilesetSessionView";
import { useTilesetSessionStore } from "@/view/stores/application/tilesetSessionStore";
import { Application as PixiApplication } from "@pixi/react";

export default function TilesetViewCanvas() {
    const [pixiApp, setPixiApp] = useState<Application | null>(null);
	const { currentTilesetSession } = useTilesetSessionStore();
    const currentViewRef = useRef<TilesetSessionView | null>(null);
    
    useEffect(() => {
        if (!currentTilesetSession || !pixiApp) return;

        const mountView = async () => {
            const sessionView = await tilesetRenderManager.getSessionView(currentTilesetSession, pixiApp);
            pixiApp.stage.removeChildren();
            currentViewRef.current?.unActivateSession();
            sessionView.activateSession();
            pixiApp.stage.addChild(sessionView.viewport);
            currentViewRef.current = sessionView;
        };

        mountView();

        return () => {
            if (currentViewRef.current) {
                pixiApp.stage.removeChild();
                currentViewRef.current = null;
            }
        };
    }, [currentTilesetSession, pixiApp]);
    
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
