import { Result } from "@/appcore/interface/common/result";
import { ITilemap, TilemapEvent } from "@/appcore/interface/tile/ITilemap";
import { BaseObject } from "@/appcore/models/core/BaseObject";

// interface ITilemap {
//     id: string;
//     orientation: "orthogonal" | "isometric" | "staggered" | "hexagonal";
//     renderOrder: "right-down" | "right-up" | "left-down" | "left-up";
//     tileWidth: number;
//     tileHeight: number;
//     width: number;
//     height: number;
//     infinite: boolean;
//     nextLayerId: number;
//     nextObjectId: number;
//     tilesets: BaseTileset[];
//     layers: BaseTileLayer[];
// }

// type TilemapData = Pick<ITilemap, "orientation" | "renderOrder" | "tileWidth" | "tileHeight" | "width" | "height" | "infinite" | "nextLayerId" | "nextObjectId" | "tilesets" | "layers">;

// type TilemapEvent = {

// }

export abstract class BaseTilemap extends BaseObject<TilemapEvent> implements ITilemap {
    public id: string;
    protected name: string;

    public getName(): string {
        return this.name;
    }
    public setName(name: string): Result {
        this.name = name;
        this.emit("Renamed", name);
        return { status: "Success" };
    }
    abstract addTilelayer(): Result;
    abstract removeTilelayerAt(id: string): Result;
    abstract reorderTilelayer(id: string, newIndex: number): Result;
    abstract createTileMap(): Promise<BaseTilemap>;
    abstract loadTilemap(file: File): Promise<BaseTilemap>;
}