import { useCallback, useState } from 'react';
import { Application } from 'pixi.js';
import { Application as PixiApplication } from '@pixi/react';
import useResizeObserver from '@/ui/hooks/useResizeObserver';
import { Button } from '@/ui/components/shadcn/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/ui/components/shadcn/dropdown-menu';
import { ScrollArea, ScrollBar } from '@/ui/components/shadcn/scroll-area';
import { Plus } from 'lucide-react';
import { HStack, VStack } from '../../custom/stack/Stack';
import { LocalizedText } from '../../custom/LocalizeText';
import { useEditRuleset } from './ContextProvider';

export default function OutputSelector() {
    const { tilesetList, dependedTilesets, rulesetSession, selectedRule, actions, triggerUpdate } = useEditRuleset();

    const [pixiApp, setPixiApp] = useState<Application | null>(null);

    const [activeTilesetId, setActiveTilesetId] = useState<string | null>(null);

    const containerRef = useResizeObserver<HTMLDivElement>(
        (entry) => {
            if (!pixiApp) return;
            const w = entry.contentRect.width;
            const h = entry.contentRect.height;
            pixiApp.renderer?.resize(w - 4, h - 4);
        },
        [pixiApp]
    );

    const onInit = useCallback( (app: Application) => {
        rulesetSession.activatePixiApp(app);
        rulesetSession.setCurrentRule(selectedRule);
        setPixiApp(app);

        if (dependedTilesets.length > 0) {
            const activeId = dependedTilesets[0].id;
            actions.selectTileset(activeId).then(() => {
                setActiveTilesetId(activeId);
                triggerUpdate();
            })
        }
    }, [rulesetSession, selectedRule, dependedTilesets, actions, triggerUpdate]);

    const selectTileset = useCallback(async (tilesetId: string) => {
        await actions.selectTileset(tilesetId);
        setActiveTilesetId(tilesetId);
        triggerUpdate();
    }, [actions, triggerUpdate]);

    return (
        <VStack className="w-full h-full gap-2">
            <HStack>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48 bg-surface-overlay">
                        {tilesetList.length === 0 ? (
                            <DropdownMenuItem disabled className="h-7"><LocalizedText message="dialog.editRuleset.noTileset" /></DropdownMenuItem>
                        ) : (
                            tilesetList.map((ts) => (
                                <DropdownMenuItem key={ts.id} onClick={() => selectTileset(ts.id)} className="h-dropdown-menu text-xs">
                                    {ts.name}
                                </DropdownMenuItem>
                            ))
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
                <ScrollArea className="flex-1 whitespace-nowrap bg-surface-base">
                    <HStack className="flex">
                        <style>{`.rs_tab::after { content: ""; position: absolute; bottom: 0; left: 0; width: calc(100%); height: 2px; background-color: var(--foreground); }`}</style>
                        {dependedTilesets.map((tilesetRef) => {
                            const isActive = activeTilesetId === tilesetRef.id;

                            if (isActive) {
                                return (
                                    <Button key={tilesetRef.id} variant="empty" size="sm" className="rounded-none border-none h-8 text-foreground cursor-pointer bg-surface-overlay rs_tab relative">
                                        {tilesetRef.name}
                                    </Button>
                                )
                            }

                            return (
                                <Button key={tilesetRef.id} onClick={() => selectTileset(tilesetRef.id)} variant="empty" size="sm" className="rounded-none border-none h-8 text-foreground cursor-pointer bg-transparent hover:bg-surface-overlay">
                                    {tilesetRef.name}
                                </Button>
                            )
                        })}
                    </HStack>
                    <ScrollBar orientation="horizontal" className="invisible" />
                </ScrollArea>
            </HStack>
            <div ref={containerRef} className="flex-1 overflow-hidden">
                <div className='flex w-full h-full overflow-hidden relative'>
                    <PixiApplication onInit={onInit} autoStart backgroundAlpha={0} className="bg-canvas shadow-sm w-full h-full absolute" />
                </div>
            </div>
        </VStack>
    );
}