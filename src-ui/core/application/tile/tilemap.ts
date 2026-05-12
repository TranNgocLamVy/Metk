
import { BaseObject, BaseObjectEvents } from "@/core/application/baseObject";
import { TilesetRefManager } from "@/core/manager/tilesetRefManager";
import { TilemapData, TilemapOrientation } from "@/shared/schema/tilemapSchema";
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

    constructor(
        tilemapData: TilemapData,
        public readonly tilemapPathSystem: FilePathSystem,
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

        this.rootLayer = new RootLayer(tilemapData.layers, this.tilesetRefManager, this.rulesetRefManager);
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

    public removeRulesetRef(ruleset: string | number): boolean {
        const rulesetIndex = this.rulesetRefManager.removeRulesetRef(ruleset);
        if (rulesetIndex === -1) return false;
        this.rootLayer.removeRulesetRef(rulesetIndex);
        return true;
    }

    public removeTilesetRef(tileset: string | number): boolean {
        const tilesetIndex = this.tilesetRefManager.removeTilesetRef(tileset);
        if (tilesetIndex === -1) return false;
        this.rootLayer.removeTilesetRef(tilesetIndex);
        return true;
    }

    public isInBoundary(coordinate: Coordinate): boolean {
        if (coordinate.col < 0 || coordinate.col >= this.width) return false;
        if (coordinate.row < 0 || coordinate.row >= this.height) return false;
        return true;
    }
}