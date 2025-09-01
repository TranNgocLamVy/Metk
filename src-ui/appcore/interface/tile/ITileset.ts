import { Texture } from "pixi.js";

import { Result } from "../common/result";

export interface ITileset {
    getName(): string;
    setName(name: string): Result;
}

export type TilesetEvent = {
    Renamed: ( name: string ) => void;
    UpdateProperty: () => void;
}

export interface ITile {
    getTexutre(): Texture;
}

export type TileEvent = {
    UpdateProperty: () => void;
} 