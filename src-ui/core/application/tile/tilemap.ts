
import { BaseObject, BaseObjectEvents } from "@/core/application/baseObject";
import { TilesetRefManager } from "@/core/manager/tilesetRefManager";
import { TilemapData } from "@/shared/schema/tilemapSchema";
import { Result, ResultStatus } from "@/shared/types/result";

import { RootLayer } from "./layer/rootLayer";

interface TilemapEvent extends BaseObjectEvents {
    onChange: () => void
}

export class Tilemap extends BaseObject<TilemapEvent> {
    public id: string;
    public name: string;
    public infinite: boolean;
    public backgroundcolor: string;

    public width: number;
    public height: number;
    public tilewidth: number;
    public tileheight: number;

    public rootLayer: RootLayer;

    constructor(
        tilemapData: TilemapData,
        public readonly tilesetRefManager: TilesetRefManager
    ) {
        super();

        this.id = tilemapData.id;
        this.name = tilemapData.name;
        this.infinite = tilemapData.infinite ?? false;
        this.backgroundcolor = tilemapData.backgroundcolor ?? "#AARRGGBB";

        this.width = tilemapData.width;
        this.height = tilemapData.height;
        this.tilewidth = tilemapData.tilewidth;
        this.tileheight = tilemapData.tileheight;
        
        this.rootLayer = new RootLayer(tilemapData.layers, this.tilesetRefManager);
        
        this.tilesetRefManager.load(tilemapData.tileset);
    }

    public serialize(): TilemapData {
        return {
            id: this.id,
            name: this.name,
            height: this.height,
            width: this.width,
            tilewidth: this.tilewidth,
            tileheight: this.tileheight,
            infinite: this.infinite,
            backgroundcolor: this.backgroundcolor,
            tileset: this.tilesetRefManager.serialize(),
            layers: this.rootLayer.serialize(),
        }
    }

    public async load(): Promise<void> {

    }

    // ------------------------------ Properties Operations ------------------------------
    public getName(): string {
        return this.name;
    }

    public async rename(name: string): Promise<Result> {
        this.name = name;
        this.eventEmitter.emit("updateProperty", "name", this.name);
        return { status: ResultStatus.Success, data: null };
    }
}