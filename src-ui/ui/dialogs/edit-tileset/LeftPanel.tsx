import { Application as PixiReactApplication } from "@pixi/react";
import { Plus, Trash2 } from "lucide-react";
import { Application as PixiApp } from "pixi.js";
import { useCallback, useEffect, useState } from "react";

import { ImageCollectionTileset } from "@/editor/model/tileset/image-collection-tileset";
import { HStack, VStack } from "@/ui/components/custom/stack/Stack";
import { Button } from "@/ui/components/shadcn/button";
import useResizeObserver from "@/ui/hooks/useResizeObserver.hook";

import { useEditTileset } from "./ContextProvider";
import { renderTilesetOverview } from "./graphics/tileset-overview.renderer";

export function LeftPanel() {
    const { tileset, tilesetName, selectedTileId, version, actions } = useEditTileset();
    const { selectTile } = actions;
    const isImageCollectionTileset = tileset instanceof ImageCollectionTileset;

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

    const handleSelectTile = useCallback((tileId: number | null) => {
        selectTile(tileId);
    }, [selectTile]);

    useEffect(() => {
        if (!pixiApp) return;

        return renderTilesetOverview({
            pixiApp,
            tileset,
            selectedTileId,
            width: size.width,
            height: size.height,
            onSelectTile: handleSelectTile,
        });
    }, [pixiApp, tileset, selectedTileId, size.width, size.height, version, handleSelectTile]);

    return (
        <VStack className="w-1/4 h-full min-w-0 min-h-0 bg-surface p-2 gap-3">
            <VStack className="gap-2">
                <HStack className="items-center gap-2">
                    <span className="text-sm font-semibold shrink-0">
                        Edit Tileset
                    </span>
                </HStack>

                <input
                    value={tilesetName}
                    onChange={(event) => actions.updateTilesetName(event.target.value)}
                    className="text-sm w-full border border-foreground/20 py-1 px-2 focus:outline-1 focus:outline-foreground bg-surface-sunken"
                />
            </VStack>

            <VStack className="flex-1 min-h-0 bg-surface-base shadow-sm">
                <header className="px-2 py-1.5 text-xs font-semibold bg-foreground/40 text-accent-foreground/80">
                    Tileset
                </header>

                <HStack className="bg-surface w-full px-1 py-1 gap-0.5">
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        type="button"
                        title="Add tile images"
                        disabled={!isImageCollectionTileset}
                        onClick={actions.addImageTiles}
                    >
                        <Plus />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-sm"
                        type="button"
                        title="Delete selected tile"
                        className="text-destructive"
                        disabled={!isImageCollectionTileset || selectedTileId == null}
                        onClick={actions.removeSelectedTile}
                    >
                        <Trash2 />
                    </Button>
                </HStack>

                <div ref={containerRef} className="w-full h-full min-h-0 overflow-hidden">
                    <PixiReactApplication
                        onInit={onInit}
                        autoStart
                        backgroundAlpha={0}
                        className="w-full h-full bg-canvas"
                    />
                </div>
            </VStack>

            <HStack justify="end" className="w-full gap-2">
                <Button variant="outline" type="button" onClick={actions.closeDialog}>
                    Cancel
                </Button>

                <Button type="button" onClick={actions.updateTileset}>
                    Update
                </Button>
            </HStack>
        </VStack>
    );
}
