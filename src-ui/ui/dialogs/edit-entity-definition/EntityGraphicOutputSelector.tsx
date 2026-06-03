import { Application as PixiApplication } from "@pixi/react";
import { Plus } from "lucide-react";
import { Application } from "pixi.js";
import { useCallback, useEffect, useState } from "react";

import { EntityGraphicType } from "@/shared/data-types/entity.data";
import { LocalizedText } from "@/ui/components/custom/LocalizeText";
import { HStack, VStack } from "@/ui/components/custom/stack/Stack";
import { Button } from "@/ui/components/shadcn/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/components/shadcn/dropdown-menu";
import { ScrollArea, ScrollBar } from "@/ui/components/shadcn/scroll-area";
import useResizeObserver from "@/ui/hooks/useResizeObserver.hook";

import { useEditEntityDefinition } from "./ContextProvider";

export default function EntityGraphicOutputSelector() {
    const {
        entity,
        version,
        tilesetList,
        dependedTilesets,
        entityGraphicSelector,
        actions,
        triggerUpdate,
    } = useEditEntityDefinition();

    const [pixiApp, setPixiApp] = useState<Application | null>(null);
    const [activeTilesetId, setActiveTilesetId] = useState<string | null>(null);

    const containerRef = useResizeObserver<HTMLDivElement>(
        (entry) => {
            if (!pixiApp) return;
            const w = entry.contentRect.width;
            const h = entry.contentRect.height;
            pixiApp.renderer?.resize(w - 4, h - 4);
        },
        [pixiApp],
    );

    useEffect(() => {
        return () => entityGraphicSelector.destroy();
    }, [entityGraphicSelector]);

    const selectTileset = useCallback(async (tilesetId: string) => {
        await actions.selectTileset(tilesetId);
        setActiveTilesetId(tilesetId);
        triggerUpdate();
    }, [actions, triggerUpdate]);

    const onInit = useCallback((app: Application) => {
        entityGraphicSelector.activatePixiApp(app);
        setPixiApp(app);

        const initialTilesetId =
            entity.graphic.type === EntityGraphicType.Tile && entity.graphic.tilesetId
                ? entity.graphic.tilesetId
                : dependedTilesets[0]?.id;

        if (initialTilesetId) {
            selectTileset(initialTilesetId);
        }
    }, [dependedTilesets, entity.graphic, entityGraphicSelector, selectTileset]);

    return (
        <VStack className="w-full h-full gap-2">
            <HStack>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48 bg-surface">
                        {tilesetList.length === 0 ? (
                            <DropdownMenuItem disabled className="h-7">
                                <LocalizedText message="dialog.editEntity.noTileset" />
                            </DropdownMenuItem>
                        ) : (
                            tilesetList.map((tileset) => (
                                <DropdownMenuItem key={tileset.id} onClick={() => selectTileset(tileset.id)} className="h-dropdown-menu text-xs">
                                    {tileset.name}
                                </DropdownMenuItem>
                            ))
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>

                <ScrollArea className="flex-1 whitespace-nowrap bg-surface-base">
                    <HStack className="flex">
                        <style>{`.entity_tab::after { content: ""; position: absolute; bottom: 0; left: 0; width: calc(100%); height: 2px; background-color: var(--foreground); }`}</style>
                        {dependedTilesets.map((tilesetRef) => {
                            const isActive = activeTilesetId === tilesetRef.id;

                            return (
                                <Button
                                    key={`${tilesetRef.id}-${version}`}
                                    onClick={() => selectTileset(tilesetRef.id)}
                                    variant="empty"
                                    size="sm"
                                    className={`rounded-none border-none h-8 text-foreground cursor-pointer ${isActive ? "bg-surface entity_tab relative" : "bg-transparent hover:bg-surface"}`}
                                >
                                    {tilesetRef.name}
                                </Button>
                            );
                        })}
                    </HStack>
                    <ScrollBar orientation="horizontal" className="invisible" />
                </ScrollArea>
            </HStack>

            <div ref={containerRef} className="flex-1 overflow-hidden">
                <div className="flex w-full h-full overflow-hidden relative">
                    <PixiApplication onInit={onInit} autoStart backgroundAlpha={0} className="bg-canvas shadow-sm w-full h-full absolute" />
                </div>
            </div>
        </VStack>
    );
}
