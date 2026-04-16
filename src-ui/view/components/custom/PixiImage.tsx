import { Application, Sprite, Texture } from "pixi.js";
import { useEffect, useState } from "react";

export default function PixiImage({ texture, pixiApp }: { texture: Texture, pixiApp: Application }) {
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