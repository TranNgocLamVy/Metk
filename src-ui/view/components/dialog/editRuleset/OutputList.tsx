// src-ui/view/components/dialog/OutputList.tsx
import { useMemo } from "react";
import { ScrollArea } from "../../shadcn/scroll-area";
import { appCore } from "@/core/appcore";
import PixiImage from "../../custom/PixiImage";
import { useEditRuleset } from "./EditRulesetContext";

export default function OutputList() {
    const { ruleset, selectedRule, version } = useEditRuleset();

    const selectedTiles = useMemo(() => {
        if (!selectedRule) return [];
        return selectedRule.getOutputs();
    }, [selectedRule, version]);

    return (
        <ScrollArea className='h-full w-full border border-foreground/20 bg-surface-overlay-sunken'>
            <div className="flex flex-wrap gap-2 p-2 w-full">
                {selectedTiles.map((tileRef) => {
                    const tilesetId = ruleset.tilesetRefManager.getTilesetIdByIndex(tileRef.tilesetIndex);
                    if (!tilesetId) return null;
                    const textureManager = appCore.editorContext.textureManager;
                    const tilesetTexture = textureManager.getTileTexture(tilesetId, tileRef.tileId);
                    if (!tilesetTexture) return null;
                    
                    return (
                        <div key={`${tilesetId}-${tileRef.tileId}`} className='w-full aspect-square border border-foreground/20'>
                            <PixiImage texture={tilesetTexture} />
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
    );
}