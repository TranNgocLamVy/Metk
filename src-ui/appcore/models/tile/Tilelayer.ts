import { Texture } from "pixi.js";

import { Result } from "@/appcore/interface/common/result";
import { BaseObject } from "@/appcore/models/core/BaseObject";

export interface ITilelayer {
    getName(): string;
    rename(name: string): Promise<Result>;
    getTileAt(position: { x: number, y: number }): ITileData;
    setTileAt(position: { x: number, y: number }, tile: ITileData): Promise<Result>;
}

export abstract class BaseTileLayer extends BaseObject implements ITilelayer {
    public id: string;
    protected name: string;
    public static event = {
        ...BaseObject.event,
    }
    public getName(): string {
        return this.name;
    }
    public async rename(name: string): Promise<Result> {
        this.name = name;
        this.emit(BaseTileLayer.event.UpdateProperty);
        return { status: "Success" };
    }
    abstract getTileAt(position: { x: number, y: number }): BaseTileData;
    abstract setTileAt(position: { x: number, y: number }, tile: any): Promise<Result>;
}


export interface ITileData {
    getCoordinate(): { x: number, y: number };
    getTexture(): Texture | null;
}

export abstract class BaseTileData implements ITileData {
    abstract getCoordinate(): { x: number, y: number };

    abstract getTexture(): Texture | null;
}