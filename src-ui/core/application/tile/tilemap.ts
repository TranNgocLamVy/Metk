
import { BaseObject, BaseObjectEvents } from "@/core/application/baseObject";
import { TilesetRefManager } from "@/core/manager/tilesetRefManager";
import { TilemapData } from "@/shared/schema/tilemapSchema";
import { Result } from "@/shared/types/result";

import { RootLayer } from "./layer/rootLayer";
import { FilePathSystem } from "@/infrastructure/projectPathSystem";
import { RulesetRefManager } from "@/core/manager/rulesetRefManager";

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

    public readonly tilemapPathSystem: FilePathSystem;

    constructor(
        tilemapData: TilemapData,
        public readonly tilesetRefManager: TilesetRefManager,
        public readonly rulesetRefManager: RulesetRefManager
    ) {
        super();
        this.tilemapPathSystem = tilesetRefManager.filePathSystem;

        this.id = tilemapData.id;
        this.name = tilemapData.name;
        this.infinite = tilemapData.infinite ?? false;
        this.backgroundcolor = tilemapData.backgroundcolor ?? "#AARRGGBB";

        this.width = tilemapData.width;
        this.height = tilemapData.height;
        this.tilewidth = tilemapData.tilewidth;
        this.tileheight = tilemapData.tileheight;
        
        this.tilesetRefManager.load(tilemapData.tilesets);
        this.rulesetRefManager.load(tilemapData.rulesets);

        this.rootLayer = new RootLayer(tilemapData.layers, this.tilesetRefManager, this.rulesetRefManager);
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
            tilesets: this.tilesetRefManager.serialize(),
            rulesets: this.rulesetRefManager.serialize(),
            layers: this.rootLayer.serialize(),
        }
    }

    public async load(): Promise<void> {

    }

    public async unload(): Promise<void> {
        this.eventEmitter.removeAllListeners();
    }

    // ------------------------------ Properties Operations ------------------------------
    public getName(): string {
        return this.name;
    }

    public async rename(name: string): Promise<Result> {
        this.name = name;
        this.eventEmitter.emit("updateProperty", "name", this.name);
        return Result.Success();
    }
}