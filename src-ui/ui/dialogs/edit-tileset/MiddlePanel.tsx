import { Application as PixiApplication } from "@pixi/react";
import { Application } from "pixi.js";
import { useCallback, useEffect, useRef, useState } from "react";

import useResizeObserver from "@/ui/hooks/useResizeObserver.hook";

import { useEditTileset } from "./ContextProvider";
import { SelectedTilePixiRenderer } from "./graphics/selected-tile.renderer";

export function MiddlePanel() {
    const { tileset, selectedTile, selectedCollisionObject } = useEditTileset();

    const [pixiApp, setPixiApp] = useState<Application | null>(null);

    const rendererRef = useRef<SelectedTilePixiRenderer | null>(null);
    const selectedCollisionObjectId = selectedCollisionObject?.id ?? null;
    const selectedCollisionObjectIdRef = useRef<string | null>(selectedCollisionObjectId);

    selectedCollisionObjectIdRef.current = selectedCollisionObjectId;

    const containerRef = useResizeObserver<HTMLDivElement>(
        (entry) => {
            const width = Math.max(1, entry.contentRect.width);
            const height = Math.max(1, entry.contentRect.height);

            pixiApp?.renderer.resize(width, height);
        },
        [pixiApp],
    );

    const onPixiInit = useCallback((app: Application) => {
        setPixiApp(app);
    }, []);

    useEffect(() => {
        if (!pixiApp) return;

        const renderer = new SelectedTilePixiRenderer({
            pixiApp,
            tileset,
            onCommit: () => {
                tileset.eventEmitter.emit("update");
            },
        });

        rendererRef.current = renderer;
        renderer.selectCollisionObject(selectedCollisionObjectIdRef.current);
        void renderer.renderSelectedTile(selectedTile);
        void renderer.init();

        return () => {
            if (rendererRef.current === renderer) {
                rendererRef.current = null;
            }

            renderer.destroy();
        };
    }, [pixiApp, tileset]);

    useEffect(() => {
        void rendererRef.current?.renderSelectedTile(selectedTile);
    }, [selectedTile]);

    useEffect(() => {
        rendererRef.current?.selectCollisionObject(selectedCollisionObjectId);
    }, [selectedCollisionObjectId]);

    return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden bg-surface p-2">
            <div ref={containerRef} className="relative h-full min-h-0 w-full overflow-hidden" >
                <PixiApplication
                    onInit={onPixiInit}
                    autoStart
                    backgroundAlpha={0}
                    className="h-full w-full bg-canvas shadow-sm"
                />

                {!selectedTile && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                        Select a tile from the left panel to edit collision.
                    </div>
                )}
            </div>
        </div>
    );
}
