import { Texture } from "pixi.js";

import { Result } from "../common/result";

export type TilelayerEvent = {
    Renamed: ( name: string ) => void;
    UpdateProperty: () => void;
    TileChange: ({x, y,tileId, tilesetId, layerId }: {x: number, y: number, tileId: number, tilesetId: number, layerId: string }) => void;
    // ChangeCoordinate: ({ x, y }: { x: number, y: number }) => void;
    // ChangeOffset: ({ x, y }: { x: number, y: number }) => void;
    // Resized: ({ width, height }: { width: number, height: number }) => void;
    // ChangeVisible: ( visible: boolean ) => void;
    // ChangeOpacity: ( opacity: number ) => void;
    // ChangeLocked: ( locked: boolean ) => void;
    // ChangeClass: ( layerClass: string ) => void;
}

export interface ITilelayer {
    getName(): string;
    setName(name: string): Result;
    getTileAt(index: number): ITileData;
    setTileAt(position: { x: number, y: number }, tile: ITileData): Result;
}

export interface ITileData {
    getCoordinate(): { x: number, y: number };
    getTexture(): Texture;
}