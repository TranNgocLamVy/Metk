import { Application } from "pixi.js";
import { useEffect, useState } from "react";

import useResizeObserver from "@/view/hooks/useResizeObserver";
import { useTilesetSessionStore } from "@/view/stores/application/tilesetSessionStore";
import { Application as PixiApplication } from "@pixi/react";

export default function TilesetViewCanvas() {
    const { pixiApp, setPixiApp } = useTilesetSessionStore();

    const containerRef = useResizeObserver<HTMLDivElement>((entry) => {
        if (!pixiApp) return;
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        pixiApp.renderer.resize(w, h);
    }, [pixiApp]);

    const onInit = (pixiApp: Application) => {
        setPixiApp(pixiApp);
    }

    return (
        <div ref={containerRef} className="bg-secondary-background w-full h-full overflow-hidden border-4 rounded-lg">
            <PixiApplication resizeTo={containerRef} onInit={onInit} autoStart backgroundAlpha={0} />
        </div>
    );
}