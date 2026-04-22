import { useEditRulesetStore } from "@/view/stores/editRulesetStore";
import { Application, Sprite, Texture } from "pixi.js";
import { useEffect, useMemo, useState } from "react";
import { ScrollArea } from "../../shadcn/scroll-area";
import { appCore } from "@/core/appcore";
import PixiImage from "../../custom/PixiImage";

export default function OutputList() {
    const { session, version } = useEditRulesetStore();

    const selectedTiles = useMemo(() => {
        const selectedRule = session.getSelectedRule();
        if (!selectedRule) return [];
        return selectedRule.getOutputs();
    }, [version, session]);

    const pixiApp = useMemo(() => {
        return session.pixiApp;
    }, [session, version]);

    return (
        <ScrollArea className='h-full w-full border border-foreground/20 bg-surface-overlay-sunken'>
            <div className="flex flex-wrap gap-2 p-2 w-full">
                {pixiApp && selectedTiles.map((tileRef) => {
                    const tilesetId = session.ruleset.tilesetRefManager.getTilesetIdByIndex(tileRef.tilesetIndex);
                    if (!tilesetId) return null;
                    
                    const textureManager = appCore.editorContext.textureManager;
                    const tilesetTexture = textureManager.getTileTexture(tilesetId, tileRef.tileId);
                    if (!tilesetTexture) return null;
                    
                    return (
                        <div key={tilesetId + '-' + tileRef.tileId} className='w-full aspect-square border border-foreground/20'>
                            <PixiImage texture={tilesetTexture} pixiApp={pixiApp} />
                        </div>
                    )
                })}
            </div>
        </ScrollArea>
    )
}