import { useMemo, useRef, useState } from 'react';
import { Application } from 'pixi.js';
import { Application as PixiApplication } from '@pixi/react';
import useResizeObserver from '@/view/hooks/useResizeObserver';
import { Button } from '@/view/components/shadcn/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/view/components/shadcn/dropdown-menu';
import { ScrollArea, ScrollBar } from '@/view/components/shadcn/scroll-area';
import { Plus } from 'lucide-react';

import { appCore } from '@/core/appcore';
import { HStack, VStack } from '../../custom/stack/Stack';
import { Result } from '@/shared/types/result';
import { ToastService } from '@/shared/services/toastService';
import { EditRulesetSession } from './session';
import { useEditRuleset } from './EditRulesetContext';
import { useTranslation } from 'react-i18next';

export default function OutputSelector() {
    const { ruleset, selectedRule, version, refresh } = useEditRuleset();
    const [pixiApp, setPixiApp] = useState<Application | null>(null);
    const sessionRef = useRef<EditRulesetSession | null>(null);
    const [activeTilesetId, setActiveTilesetId] = useState<string | null>(null);

    const usedTilesets = useMemo(() => {
        return ruleset.tilesetRefManager.serialize();
    }, [ruleset, version]);

    const selectTileset = async (tilesetId: string) => {
        const session = sessionRef.current;
        if (!session) return;
        const currentProject = appCore.editorContext.currentProject;
        if (!currentProject) return;

        const tilesetManager = currentProject.tilesetManager;
        const tilesetResult = await tilesetManager.loadTileset({ id: tilesetId });
        if (tilesetResult.status !== Result.Status.Success) {
            ToastService.error({ message: tilesetResult.message });
            return;
        }
        
        const tileset = tilesetResult.data;
        session.setTileset(tileset);
        session.setCurrentRule(selectedRule);
        setActiveTilesetId(tileset.id);
    };

    const containerRef = useResizeObserver<HTMLDivElement>(
        (entry) => {
            if (!pixiApp) return;
            const w = entry.contentRect.width;
            const h = entry.contentRect.height;
            pixiApp.renderer?.resize(w - 4, h - 4);
        },
        [pixiApp, version]
    );

    const onInit = (app: Application) => {
        const session = new EditRulesetSession(ruleset, refresh);
        sessionRef.current = session;
        session.activatePixiApp(app);
        session.setCurrentRule(selectedRule);
        // TODO: Select first tileset after loading
        setPixiApp(app);
        refresh();
    };

    return (
        <VStack className="w-full h-full gap-2">
            <HStack>
                <TilesetSelector selectTileset={selectTileset} />
                <ScrollArea className="flex-1 whitespace-nowrap bg-surface-base">
                    <HStack className="flex">
                        {usedTilesets.refs.map((tilesetRef) => (
                            <Button key={tilesetRef.id} onClick={() => selectTileset(tilesetRef.id)} variant="empty" size="sm" className={`rounded-none border-none h-8 text-foreground cursor-pointer ${activeTilesetId === tilesetRef.id ? "bg-surface-overlay rs_tab relative" : "bg-transparent hover:bg-surface-overlay"}`}>
                                <style>{`.rs_tab::after { content: ""; position: absolute; bottom: 0; left: 0; width: calc(100%); height: 2px; background-color: var(--foreground); }`}</style>
                                {tilesetRef.name}
                            </Button>
                        ))}
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

function TilesetSelector({ selectTileset }: { selectTileset: (id: string) => void }) {
    const { t: translate } = useTranslation();

    const { ruleset, version, refresh } = useEditRuleset();

    const allTilesets = useMemo(() => {
        const currentProject = appCore.editorContext.currentProject;
        if (!currentProject) return [];
        return currentProject.tilesetManager.serialize();
    }, [version]);

    const handleAddTileset = async (tilesetId: string) => {
        const index = ruleset.tilesetRefManager.getTilesetRefIndex(tilesetId);
        if (index > -1) selectTileset(tilesetId);
        refresh();
    };

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
                    <Plus className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-surface-overlay">
                {allTilesets.length === 0 ? (
                    <DropdownMenuItem disabled className="h-7">{translate("dialog.editRuleset.noTileset")}</DropdownMenuItem>
                ) : (
                    allTilesets.map((ts) => (
                        <DropdownMenuItem key={ts.id} onClick={() => handleAddTileset(ts.id)} className="h-dropdown-menu text-xs">
                            {ts.name}
                        </DropdownMenuItem>
                    ))
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}