import { Result } from "../common/result";
import { ITilelayer } from "./ITilelayer";

export interface ITilemap {
    createTileMap(): Promise<ITilemap>;
    loadTilemap(file: File): Promise<ITilemap>;
    getName(): string;
    setName(name: string): Result;
    addTilelayer(): Result;
    removeTilelayerAt(id: string): Result;
    reorderTilelayer(id: string, newIndex: number): Result;
}
export type TilemapEvent = {
    Renamed: ( name: string ) => void;
    UpdateProperty: () => void;
    TilelayerAdded: ( tilelayer: ITilelayer ) => void;
    TilelayerRemoved: ( tilelayer: ITilelayer ) => void; 
    TilelayerReordered: ( tilelayer: ITilelayer, newIndex: number ) => void;
}