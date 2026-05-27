import { Application as PixiReactApplication } from "@pixi/react";
import { Application as PixiApp } from "pixi.js";
import { useCallback, useEffect, useState } from "react";

import { VStack } from "@/ui/components/custom/stack/Stack";
import useResizeObserver from "@/ui/hooks/useResizeObserver.hook";

import { useEditTileset } from "./ContextProvider";
import { clearSelectedTileRenderer, renderSelectedTile } from "./graphics/selected-tile.renderer";

export function MiddlePanel() {
    const { tileset, selectedTile, version } = useEditTileset();

    const [pixiApp, setPixiApp] = useState<PixiApp | null>(null);
    const [size, setSize] = useState({ width: 1, height: 1 });

    const containerRef = useResizeObserver<HTMLDivElement>(
        (entry) => {
            const width = Math.max(1, entry.contentRect.width);
            const height = Math.max(1, entry.contentRect.height);

            setSize({ width, height });
            pixiApp?.renderer.resize(width, height);
        },
        [pixiApp],
    );

    const onInit = useCallback((app: PixiApp) => {
        setPixiApp(app);
    }, []);

    useEffect(() => {
        if (!pixiApp) return;

        if (!selectedTile) {
            clearSelectedTileRenderer(pixiApp);
            return;
        }

        return renderSelectedTile({
            pixiApp,
            tileset,
            tile: selectedTile,
            width: size.width,
            height: size.height,
        });
    }, [pixiApp, tileset, selectedTile, size.width, size.height, version]);

    return (
        <VStack className="w-1/2 h-full min-w-0 min-h-0 bg-surface-overlay shadow-sm p-2">
            <div ref={containerRef} className="w-full h-full min-h-0 overflow-hidden relative">
                <PixiReactApplication
                    onInit={onInit}
                    autoStart
                    backgroundAlpha={0}
                    className="w-full h-full bg-canvas"
                />

                {!selectedTile && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground pointer-events-none">
                        Select one tile
                    </div>
                )}
            </div>
        </VStack>
    );
}
