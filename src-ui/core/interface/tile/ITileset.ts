import { Texture } from "pixi.js";

import { Result } from "@/shared/types/result";

export interface ITileset {
    getName(): string;
    rename(name: string): Promise<Result>;
}


export interface ITile {
    getTexture(): Texture;
}