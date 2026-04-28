import { appCore } from "@/core/appcore";
import { TextureUtils } from "@/shared/utils/textureUtils";
import { Texture } from "pixi.js";
import { useEffect, useState } from "react";

export default function PixiImage({ texture }: { texture: Texture | null }) {
    const [imgSrc, setImgSrc] = useState<string>('');

    useEffect(() => {
        const loadTexture = async () => {
            const renderTexture = texture ? texture : await appCore.textureManager.getErrorTexture();
            const imageSrc = await TextureUtils.extractTexture(renderTexture);
            setImgSrc(imageSrc);
        }
        loadTexture();
    }, [texture]);

    if (!imgSrc) return null;
    return <img src={imgSrc} alt="tile" className="w-full h-full object-contain" />;
}