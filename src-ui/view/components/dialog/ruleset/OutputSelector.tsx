// src-ui/view/components/dialog/ruleset/OutputSelector.tsx
import { useEffect, useMemo, useState } from 'react';
import { Application } from 'pixi.js';
import { Application as PixiApplication } from '@pixi/react';
import useResizeObserver from '@/view/hooks/useResizeObserver';
import { Button } from '@/view/components/shadcn/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/view/components/shadcn/dropdown-menu';
import { ScrollArea, ScrollBar } from '@/view/components/shadcn/scroll-area';
import { Plus } from 'lucide-react';

import { AppCore } from '@/core/appcore';
import { useEditRulesetStore } from '@/view/stores/editRulesetStore';
import { HStack, VStack } from '../../custom/stack/Stack';
import { Result } from '@/shared/types/result';
import { ToastService } from '@/shared/services/toastService';


export default function OutputSelector() {
    const { session, version, refresh } = useEditRulesetStore();

    const rule = useMemo(() => {
        return session.getSelectedRule();
    }, [session, version]);

    const usedTilesets = useMemo(() => {
        return session.ruleset.tilesetRefManager.serialize();
    }, [session])

    useEffect(() => {
        if (session.pixiApp && usedTilesets.length > 0) selectTileset(usedTilesets[0].id);
    }, [session, version])

    const [activeTilesetId, setActiveTilesetId] = useState<string | null>(null);

    const selectTileset = async (tilesetId: string) => {
        const renderer = session.renderer;
        if (!renderer) return;

        const tilesetManager = AppCore.getIns().editorContext.getCurrentProject().tilesetManager;
        const tilesetResult = await tilesetManager.loadTileset({ id: tilesetId });
        if (tilesetResult.status !== Result.Status.Success) {
            ToastService.error({ message: tilesetResult.message });
            return;
        }
        const tileset = tilesetResult.data;
        renderer.setTileset(tileset);
        renderer.setCurrentRule(rule);
        setActiveTilesetId(tileset.id);
    }

    useEffect(() => {
        const renderer = session.renderer;
        if (renderer) renderer.setCurrentRule(rule)
    }, [rule]);

    const containerRef = useResizeObserver<HTMLDivElement>(
        (entry) => {
            if (!session.pixiApp) return;
            const w = entry.contentRect.width;
            const h = entry.contentRect.height;
            session.pixiApp.renderer?.resize(w - 4, h - 4);
        },
        [session, version]
    );

    const onInit = (app: Application) => {
        session.activateSession(app);
        session.renderer.setCurrentRule(rule);
        refresh();
    }

    return (
        <VStack className="w-full h-full gap-4">
            <HStack>
                <TilesetSelector selectTileset={selectTileset} />
                <ScrollArea className="flex-1 whitespace-nowrap">
                    <HStack className="flex py-1">
                        {usedTilesets.map((tilesetRef) => (
                            <Button key={tilesetRef.id} onClick={() => selectTileset(tilesetRef.id)} size={"sm"} className={`rounded-none text-foreground hover:bg-secondary-background cursor-pointer ${activeTilesetId === tilesetRef.id ? "border-b-2 border-b-foreground bg-secondary-background shadow-sm" : "bg-background"}`}>
                                {tilesetRef.name}
                            </Button>
                        ))}
                    </HStack>
                    <ScrollBar orientation="horizontal" className="invisible" />
                </ScrollArea>
            </HStack>
            <div ref={containerRef} className="flex-1 overflow-hidden bg-secondary-background">
                <div className='flex w-full h-full overflow-hidden relative'>
                    <PixiApplication onInit={onInit} autoStart backgroundAlpha={0} className="rounded-lg border-2 shadow-sm w-full h-full absolute" />
                </div>
            </div>
        </VStack>

    );
}


function TilesetSelector({ selectTileset }: { selectTileset: (tilesetId: string) => void }) {
    const { session, refresh } = useEditRulesetStore();

    const allTilesets = useMemo(() => {
        return AppCore.getIns().editorContext.getCurrentProject().tilesetManager.serialize()
    }, [session])

    const handleAddTileset = async (tilesetId: string) => {
        const ruleset = session.ruleset;
        const index = ruleset.tilesetRefManager.getTilesetIndexById(tilesetId);
        if (index > -1) selectTileset(tilesetId);
        refresh();
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 w-8 p-0 shrink-0">
                    <Plus className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-background">
                {allTilesets.length === 0 ? (
                    <DropdownMenuItem disabled className="h-dropdown-menu">No available tilesets</DropdownMenuItem>
                ) : (
                    allTilesets.map((ts) => (
                        <DropdownMenuItem key={ts.id} onClick={() => handleAddTileset(ts.id)} className="h-dropdown-menu">
                            {ts.name}
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}