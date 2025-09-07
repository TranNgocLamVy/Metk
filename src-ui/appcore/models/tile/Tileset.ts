import { Texture } from "pixi.js";
import { create } from "zustand";

import { Result, ResultStatus } from "@/appcore/interface/common/result";
import { BaseObject } from "@/appcore/models/core/BaseObject";

export interface ITileset {
    getName(): string;
    rename(name: string): Promise<Result>;
}


export abstract class BaseTileset extends BaseObject implements ITileset {
    public name: string;

    public static event = {
        ...BaseObject.event,
    }

    public getName(): string {
        return this.name;
    }

    public async rename(name: string): Promise<Result> {
        this.name = name;
        this.emit(BaseTileset.event.UpdateProperty);
        return { status: ResultStatus.Success };
    }

    public abstract getTile(id: number): BaseTile | null;

    public static async loadTileset(filePath: string): Promise<BaseTileset | null> {
        throw new Error("Method not implemented.");
    }

    public static async createTileset(): Promise<BaseTileset | null> {
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