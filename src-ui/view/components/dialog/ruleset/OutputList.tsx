import { useEditRulesetStore } from "@/view/stores/editRulesetStore";
import { Application, Sprite, Texture } from "pixi.js";
import { useEffect, useMemo, useState } from "react";
import { ScrollArea } from "../../shadcn/scroll-area";
import { AppCore } from "@/core/appcore";
import { VStack } from "../../custom/stack/Stack";

export function PixiImage({ texture, pixiApp }: { texture: Texture, pixiApp: Application }) {
    const [imgSrc, setImgSrc] = useState<string>('');

    useEffect(() => {
        if (!texture) return;
        const sprite = new Sprite(texture);
        pixiApp.renderer.extract.base64(sprite).then((base64) => {
            setImgSrc(base64);
        })
    }, [texture]);

    if (!imgSrc) return null;
    return <img src={imgSrc} alt="tile" className="w-full h-full object-contain" />;
}


export default function OutputList() {
    const { session, version } = useEditRulesetStore();

    const ruleset = useMemo(() => {
        return session.ruleset;
    }, [session])

    const selectedTiles = useMemo(() => {
        const selectedRule = session.getSelectedRule();
        if (!selectedRule) return [];
        return selectedRule.getOutputs();
    }, [version, session]);

    const pixiApp = useMemo(() => {
        return session.pixiApp;
    }, [session]);

    return (
        <ScrollArea className='h-full w-full border border-foreground/20 bg-secondary-background'>
            <div className="flex flex-wrap gap-2 p-2 w-full">
                {pixiApp && selectedTiles.map((tileRef) => {
                    const tilesetRefManager = ruleset.tilesetRefManager;
                    const tilesetId = tilesetRefManager.getTilesetIdByIndex(tileRef.tilesetIndex);
                    if (!tilesetId) return null;
                    
                    const textureManager = AppCore.getIns().editorContext.textureManager;
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