import { Point } from "pixi.js";
import { v4 as uuidv4 } from "uuid";

import { TilesetRefManager } from "@/core/manager/tilesetRefManager";
import { TileLayerData, TileRefData } from "@/shared/schema/layerSchema";
import { ErrorResult, Result, ResultStatus, SuccessResult } from "@/shared/types/result";

import { Tile } from "../tileset";
import { BaseLayer, BaseLayerEvents, IGroupLayer } from "./baseLayer";

interface TileLayerEvents extends BaseLayerEvents {
    tileChanged: (x: number, y: number) => void
}

export class TileLayer extends BaseLayer<TileLayerEvents> {
    public tilesRef: (TileRef | null)[][] = [];
    public coordinate: Coordinate = { col: 0, row: 0 };
    public offset: Point = new Point(0, 0);
    public size: { width: number, height: number } = { width: 0, height: 0 }


    constructor(tileLayerData: TileLayerData, parentLayer: IGroupLayer | null, tilesetRefManager: TilesetRefManager) {
        super(tileLayerData.id, tilesetRefManager);

        if (parentLayer) this.parentLayer = parentLayer;

        this.name = tileLayerData.name;

        this.coordinate.col = tileLayerData.x ?? 0;
        this.coordinate.row = tileLayerData.y ?? 0;
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

        const row = this.tilesRef[coordinate.y];
        if (!row) return ErrorResult("Tile row not found");

        const tileRef = row[coordinate.x];
        if (tileRef === undefined) return ErrorResult("Tile not found");

        return SuccessResult(tileRef);
    }

    public setTileRefAt(coordinate: { x: number, y: number }, tile: Tile): Result<TileRefData> {
        if (coordinate.x < 0 || coordinate.x >= this.size.width) return ErrorResult("Tile not found, x is out of range");
        if (coordinate.y < 0 || coordinate.y >= this.size.height) return ErrorResult("Tile not found, y is out of range");

        const tileId = tile.id;
        const tilesetIndex = this.tilesetRefManager.getTilesetIndex(tile.tileset);
        if (tilesetIndex === -1) return ErrorResult("Tile not found, tileset not found");

        // Ensure row exists
        if (!this.tilesRef[coordinate.y]) {
            this.tilesRef[coordinate.y] = [];
        }

        let tileRef = this.tilesRef[coordinate.y][coordinate.x];

        if (tileRef === null || tileRef === undefined) {
            tileRef = new TileRef({ tileId, tilesetIndex });
            this.tilesRef[coordinate.y][coordinate.x] = tileRef;
        }
        
        const result = tileRef.setTile({ tileId, tilesetIndex });
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
            x: this.coordinate.col,
            y: this.coordinate.row,
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

    public override clone(): TileLayer {
        const layerData = this.serialize();
        layerData.id = uuidv4();
        return new TileLayer(layerData, this.parentLayer, this.tilesetRefManager);
    }

    public override traverse(cb: (layer: BaseLayer<any>) => void): void {
        cb(this);
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