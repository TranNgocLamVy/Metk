import { Texture } from "pixi.js";

import { Result, ResultStatus } from "@/appcore/interface/common/result";
import { BaseTileData, BaseTileLayer } from "@/appcore/models/tile/Tilelayer";
import { TileLayerData } from "@/appcore/schemas/tilemapSchema";

import { DefaultTile } from "./defaultTileset";

export class DefaultTileLayer extends BaseTileLayer {

    private tiles: DefaultTileData[][] = [];

    public layerClass: string;
    public coordinate: { x: number, y: number } = { x: 0, y: 0 };
    public offset: { x: number, y: number } = { x: 0, y: 0 };
    public size: { width: number, height: number } = { width: 0, height: 0 }
    public opacity: number = 1;
    public visible: boolean = true;
    public locked: boolean = false;

    public static event = {
        ...BaseTileLayer.event,
        TileChanged: "TileChanged"
    }

    constructor(tileLayerData: TileLayerData) {
        super();
        this.id = tileLayerData.id;
        this.name = tileLayerData.name;
        this.coordinate.x = tileLayerData.x ?? 0;
        this.coordinate.y = tileLayerData.y ?? 0;
        this.size.width = tileLayerData.width;
        this.size.height = tileLayerData.height;
        this.opacity = tileLayerData.opacity ?? 1;
        this.visible = tileLayerData.visible != 0 ? true : false;
        this.locked = tileLayerData.locked != 0 ? true : false;
        this.offset.x = tileLayerData.offsetx ?? 0;
        this.offset.y = tileLayerData.offsety ?? 0;
    }

    public getTileAt(position: { x: number, y: number }): DefaultTileData {
        return this.tiles[position.x][position.y];
    }

    public async setTileAt(position: { x: number, y: number }, tile: DefaultTile): Promise<Result> {
        const result = this.tiles[position.x][position.y].setTile(tile);
        if (result.status === ResultStatus.Success) {
            this.emit("TileChanged", { x: position.x, y: position.y });
            return result;
        }
        return { status: ResultStatus.Cancel };
    }
}

export class DefaultTileData extends BaseTileData {
    public coordinate: { x: number, y: number };
    public tile: DefaultTile | null;

    constructor(coordinate: { x: number, y: number }, tile: DefaultTile | null = null) {
        super();
        this.coordinate = coordinate;
        this.tile = tile;
    }

    public getCoordinate(): { x: number, y: number } {
        return this.coordinate;
    }

    public getTexture(): Texture | null {
        if (!this.tile) return null;
        return this.tile.getTexture();
    }

    public setTile(tile: DefaultTile): Result {
        this.tile = tile;
        return { status: ResultStatus.Success };
    }
}