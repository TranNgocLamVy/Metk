import { Result, ResultStatus } from "@/appcore/interface/common/result";
import { BaseObject } from "@/appcore/models/core/BaseObject";

export interface ITilemap {
    getName(): string;
    rename(name: string): Promise<Result>;
    addTilelayer(): Promise<Result>;
    removeTilelayer(id: string): Promise<Result>;
    reorderTilelayer(id: string, newIndex: number): Promise<Result>;
}

export abstract class BaseTilemap extends BaseObject implements ITilemap {
    public id: string;
    protected name: string;
    public static event = {
        ...BaseObject.event,
        TilelayerAdded: "TilelayerAdded",
        TilelayerRemoved: "TilelayerRemoved",
        TilelayerReordered: "TilelayerReordered",
    }
    public getName(): string {
        return this.name;
    }
    public async rename(name: string): Promise<Result> {
        this.name = name;
        this.emit(BaseTilemap.event.UpdateProperty);
        return { status: ResultStatus.Success };
    }
    abstract addTilelayer(): Promise<Result>;
    abstract removeTilelayer(id: string): Promise<Result>;
    abstract reorderTilelayer(id: string, newIndex: number): Promise<Result>;
    public static loadTilemap(filePath: string): Promise<BaseTilemap | null> {
        throw new Error("Method not implemented.");
    }
    public static createTileMap(): Promise<BaseTilemap | null> {
        throw new Error("Method not implemented.");
    }
}