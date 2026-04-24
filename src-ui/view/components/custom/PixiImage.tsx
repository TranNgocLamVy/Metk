import { TextureUtils } from "@/shared/utils/textureUtils";
import { Application, Texture } from "pixi.js";
import { useEffect, useState } from "react";

export default function PixiImage({ texture }: { texture: Texture, pixiApp?: Application }) {
    const [imgSrc, setImgSrc] = useState<string>('');

    useEffect(() => {
        if (!texture) return;
        TextureUtils.extractTexture(texture).then(setImgSrc);
    }, [texture]);

    if (!imgSrc) return null;
    return <img src={imgSrc} alt="tile" className="w-full h-full object-contain" />;
}