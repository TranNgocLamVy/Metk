import { Texture } from "pixi.js";

import { Result } from "@/core/constance/common/result";

export interface ITileset {
    getName(): string;
    rename(name: string): Promise<Result>;
}


export interface ITile {
    getTexture(): Texture;
}