import { BaseObject } from "../base-object";
import { BaseTilelayer } from "./tilelayer";
import { BaseTileset } from "./tileset";

interface ITilemap {
    orientation: "orthogonal" | "isometric" | "staggered" | "hexagonal";
    renderOrder: "right-down" | "right-up" | "left-down" | "left-up";
    tileWidth: number;
    tileHeight: number;
    width: number;
    height: number;
    infinite: boolean;
    nextLayerId: number;
    nextObjectId: number;
    tilesets: BaseTileset[];
    layers: BaseTilelayer[];
}

type TilemapData = Pick<ITilemap, "orientation" | "renderOrder" | "tileWidth" | "tileHeight" | "width" | "height" | "infinite" | "nextLayerId" | "nextObjectId" | "tilesets" | "layers">;

type TilemapEvent = {
    
}

export class BaseTilemap extends BaseObject<TilemapEvent> implements ITilemap {
    public orientation: "orthogonal" | "isometric" | "staggered" | "hexagonal";
    public renderOrder: "right-down" | "right-up" | "left-down" | "left-up";
    public tileWidth: number;
    public tileHeight: number;
    public width: number;
    public height: number;
    public infinite: boolean;
    public nextLayerId: number;
    public nextObjectId: number;
    public tilesets: BaseTileset[];
    public layers: BaseTilelayer[];

    constructor(data: TilemapData) {
        super();

        const { orientation, renderOrder, tileWidth, tileHeight, width, height, infinite, nextLayerId, nextObjectId, tilesets, layers } = data;
        this.orientation = orientation;
        this.renderOrder = renderOrder;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.width = width;
        this.height = height;
        this.infinite = infinite;
        this.nextLayerId = nextLayerId;
        this.nextObjectId = nextObjectId;
        
        this.tilesets = tilesets;
        this.layers = layers;
    }
}