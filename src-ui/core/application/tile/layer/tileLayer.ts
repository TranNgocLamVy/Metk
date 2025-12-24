import { TileLayerData, TileRefData } from "@/shared/schema/layerSchema";
import { ErrorResult, Result, ResultStatus, SuccessResult } from "@/shared/types/result";

import { BaseLayer, BaseLayerEvents, IGroupLayer } from "./baseLayer";

interface TileLayerEvents extends BaseLayerEvents {
    tileChanged: (x: number, y: number) => void
}

export class TileLayer extends BaseLayer<TileLayerEvents> {
    public parentLayer: IGroupLayer;
    public tilesRef: (TileRef | null)[][] = [];
    public coordinate: { x: number, y: number } = { x: 0, y: 0 };
    public offset: { x: number, y: number } = { x: 0, y: 0 };
    public size: { width: number, height: number } = { width: 0, height: 0 }
    public opacity: number = 1;
    public visible: boolean = true;
    public locked: boolean = false;

    constructor(tileLayerData: TileLayerData, parentLayer: IGroupLayer) {
        super(tileLayerData.id);

        this.parentLayer = parentLayer;

        this.name = tileLayerData.name;

        this.coordinate.x = tileLayerData.x ?? 0;
        this.coordinate.y = tileLayerData.y ?? 0;
        this.offset.x = tileLayerData.offsetx ?? 0;
        this.offset.y = tileLayerData.offsety ?? 0;
        
        this.size.width = tileLayerData.width;
        this.size.height = tileLayerData.height;
        
        this.opacity = tileLayerData.opacity;
        this.visible = tileLayerData.visible;
        this.locked = tileLayerData.locked;

        this.tilesRef = tileLayerData.tilesData.map((tileRefRow) => {
            return tileRefRow.map((tileRef) => {
                if (tileRef === null) return null;
                return new TileRef(tileRef);
            });
        });
    }

    public getTileRefAt(coordinate: { x: number, y: number }): Result<TileRef | null> {
        if (coordinate.x < 0 || coordinate.x >= this.size.width) return ErrorResult("Tile not found, x is out of range");
        if (coordinate.y < 0 || coordinate.y >= this.size.height) return ErrorResult("Tile not found, y is out of range");

        const tileRef = this.tilesRef[coordinate.y][coordinate.x];
        if (tileRef === undefined) return ErrorResult("Tile not found");

        return SuccessResult(tileRef);
    }

    public setTileRefAt(coordinate: { x: number, y: number }, tileId: number, tilesetIndex: number): Result<TileRefData> {
        if (coordinate.x < 0 || coordinate.x >= this.size.width) return ErrorResult("Tile not found, x is out of range");
        if (coordinate.y < 0 || coordinate.y >= this.size.height) return ErrorResult("Tile not found, y is out of range");

        const tileRef = this.tilesRef[coordinate.y][coordinate.x];
        if (tileRef === undefined) return ErrorResult("Tile not found");

        if (tileRef === null) {
            const newTileRef = new TileRef({ tileId, tilesetIndex });
            this.tilesRef[coordinate.y][coordinate.x] = newTileRef;
        }
        const result = tileRef!.setTile({ tileId, tilesetIndex });
        if (result.status === ResultStatus.Success) {
            this.eventEmitter.emit("tileChanged", coordinate.x, coordinate.y);
            return result;
        }
        return result;
    }

    public override serialize(): TileLayerData {
        return {
            id: this.id,
            layerType: "tile",
            name: this.name,
            x: this.coordinate.x,
            y: this.coordinate.y,
            width: this.size.width,
            height: this.size.height,
            opacity: this.opacity,
            visible: this.visible,
            locked: this.locked,
            offsetx: this.offset.x,
            offsety: this.offset.y,
            tilesData: this.tilesRef.map((tileRefRow) => tileRefRow.map(tileRef => tileRef ? tileRef.serialize() : null)),
        }
    }
}

export class TileRef {
    public id: string;
    private tileId: number;
    private tilesetIndex: number;

    constructor(tileData: TileRefData) {
        this.tileId = tileData.tileId;
        this.tilesetIndex = tileData.tilesetIndex;

    }
    public serialize(): TileRefData {
        return {
            tileId: this.tileId,
            tilesetIndex: this.tilesetIndex,
        }
    }
    public setTile(newTileRefData: TileRefData): Result<TileRefData> {
        const preTileRefData: TileRefData = {
            tileId: this.tileId,
            tilesetIndex: this.tilesetIndex,
        }
        this.tileId = newTileRefData.tileId;
        this.tilesetIndex = newTileRefData.tilesetIndex;
        return SuccessResult(preTileRefData);

    }
    public getTile(): TileRefData {
        return {
            tileId: this.tileId,
            tilesetIndex: this.tilesetIndex,
        }
    }
}