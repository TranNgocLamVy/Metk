
import { BaseObject, BaseObjectEvents } from "@/core/application/baseObject";
import { TilesetRefManager } from "@/core/manager/tilesetRefManager";
import { TilemapData, TilemapOrientation } from "@/shared/schema/tilemapSchema";
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
    public orientation: TilemapOrientation;
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
        this.orientation = tilemapData.orientation;
        this.backgroundcolor = tilemapData.backgroundcolor ?? "#AARRGGBB";

        this.width = tilemapData.width;
        this.height = tilemapData.height;
        this.tilewidth = tilemapData.tilewidth;
        this.tileheight = tilemapData.tileheight;
        
        this.tilesetRefManager.loadData(tilemapData.tilesets.refs, tilemapData.tilesets.nextIndex);
        this.rulesetRefManager.loadData(tilemapData.rulesets.refs, tilemapData.rulesets.nextIndex);

        this.rootLayer = new RootLayer(
            tilemapData.layers, 
            this.tilesetRefManager, 
            this.rulesetRefManager, 
            { 
                tileWidth: this.tilewidth, 
                tileHeight: this.tileheight,
                orientation: this.orientation,
            }
        );
    }

    public serialize(): TilemapData {
        return {
            id: this.id,
            name: this.name,
            orientation: this.orientation,
            height: this.height,
            width: this.width,
            tilewidth: this.tilewidth,
            tileheight: this.tileheight,
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

    public removeRulesetRef(ruleset: string | number): void {
        const rulesetIndex = this.rulesetRefManager.removeRulesetRef(ruleset);
        if (rulesetIndex === -1) return;
        this.rootLayer.removeRulesetRef(rulesetIndex);
    }

    public removeTilesetRef(tileset: string | number): void {
        const tilesetIndex = this.tilesetRefManager.removeTilesetRef(tileset);
        if (tilesetIndex === -1) return;
        this.rootLayer.removeTilesetRef(tilesetIndex);
    }

    public isInBoundary(coordinate: Coordinate): boolean {
        if (coordinate.col < 0 || coordinate.col >= this.width) return false;
        if (coordinate.row < 0 || coordinate.row >= this.height) return false;
        return true;
    }
}