import { Sprite } from 'pixi.js';
import { BaseObject } from '../base-object';

type TilelayerEvent = {
    tileChange: ({x, y,tileId, tilesetId, layerId }: {x: number, y: number, tileId: number, tilesetId: number, layerId: string }) => void;
    layerResized: ({ width, height }: { width: number, height: number }) => void;
    layerRenamed: ({ layerName }: { layerName: string }) => void;
}

interface ITilelayer {
    layerName: string;
    layerId: string;
    width: number;
    height: number;
    layerData: TileData[][];

    setTile(x: number, y: number, tileId: number, tilesetId: number): void;
    resize(width: number, height: number): void;
    renameLayer(layerName: string): void;

    getTile(x: number, y: number): TileData;
}
type LayerData = Pick<ITilelayer, "layerName" | "layerId" | "width" | "height" | "layerData">;
export type TileData = {
    tileId: number;
    tilesetId: number;
    sprite: Sprite | null;
}

export class BaseTilelayer extends BaseObject<TilelayerEvent> implements ITilelayer {
    public layerName: string;
    public layerId: string
    public width: number;
    public height: number;
    public layerData: TileData[][];
    constructor(option: LayerData) {
        super();

        const { layerName, layerId, width, height, layerData } = option;
        this.layerName = layerName;
        this.layerId = layerId;
        this.width = width;
        this.height = height;
        this.layerData = layerData;
    }

    public setTile(x: number, y: number, tileId: number, tilesetId: number) {
        this.layerData[y][x] = { tileId, tilesetId, sprite: null };
        this.emit("tileChange", {x, y, tileId, tilesetId, layerId: this.layerId });
    }

    public resize(width: number, height: number) {
        this.width = width;
        this.height = height;
        this.emit("layerResized", { width, height });
    }

    public renameLayer(layerName: string) {
        this.layerName = layerName;
        this.emit("layerRenamed", { layerName });
    }

    public getTile(x: number, y: number): TileData {
        return this.layerData[y][x];
    }
}