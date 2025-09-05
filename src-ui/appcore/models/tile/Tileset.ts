import { Texture } from "pixi.js";

import { Result, ResultStatus } from "@/appcore/interface/common/result";
import { BaseObject, BaseObjectEvents } from "@/appcore/models/core/BaseObject";
import { FileHandle } from "@tauri-apps/plugin-fs";

export interface ITileset {
    getName(): string;
    setName(name: string): Result;
}

export interface TilesetEvents extends BaseObjectEvents {
    Renamed: ( name: string ) => void;
}

export abstract class BaseTileset extends BaseObject implements ITileset {
    public name: string;

    public static event = {
        ...BaseObject.event,
    }

    public getName(): string {
        return this.name;
    }

    public setName(name: string): Result {
        this.name = name;
        this.emit(BaseTileset.event.UpdateProperty);
        return { status: ResultStatus.Success };
    }

    public abstract getTile(id: number): BaseTile | null;

    public static loadTileset(filePath: string): Promise<BaseTileset | null> {
        throw new Error("Method not implemented.");
    }
}


export interface ITile {
    getTexture(): Texture;
}

export type TileEvent = {
    UpdateProperty: () => void;
} 

export abstract class BaseTile extends BaseObject implements ITile {
    abstract getTexture(): Texture;
}