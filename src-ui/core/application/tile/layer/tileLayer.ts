import { Point } from "pixi.js";
import { v4 as uuidv4 } from "uuid";

import { TilesetRefManager } from "@/core/manager/tilesetRefManager";
import { TileLayerData, TileRefData } from "@/shared/schema/layerSchema";
import { Result } from "@/shared/types/result";
import { MatrixUtils } from "@/shared/utils/maxtrixUtils";

import { BaseLayer, BaseLayerEvents, IGroupLayer } from "./baseLayer";

interface TileLayerEvents extends BaseLayerEvents {
    tileChanged: (x: number, y: number) => void
}

export class TileLayer extends BaseLayer<TileLayerEvents> {
    public tilesRef: (TileRef | null)[][] = [];
    public coordinate: Coordinate = { col: 0, row: 0 };
    public offset: Point = new Point(0, 0);
    public size: { width: number, height: number } = { width: 0, height: 0 }


    constructor(tileLayerData: TileLayerData, parentLayer: IGroupLayer, tilesetRefManager: TilesetRefManager) {
        super(tileLayerData.id, tilesetRefManager);

        this.parentLayer = parentLayer;

        this.name = tileLayerData.name;

        this.coordinate.col = tileLayerData.x;
        this.coordinate.row = tileLayerData.y;
        this.offset.x = tileLayerData.offsetx;
        this.offset.y = tileLayerData.offsety;

        this.size.width = tileLayerData.width;
        this.size.height = tileLayerData.height;

        this.opacity = tileLayerData.opacity;
        this.visible = tileLayerData.visible;
        this.locked = tileLayerData.locked;

        const tilesRef = tileLayerData.layerData.split("\n").map((tileRow) => {
            return tileRow.split(",").map((tileRef) => {
                if (tileRef === "0") return null;
                const tileId = parseInt(tileRef.split(":")[0]);
                const tilesetIndex = parseInt(tileRef.split(":")[1]);
                if (isNaN(tileId) || isNaN(tilesetIndex)) return null;
                return new TileRef(tileId, tilesetIndex);
            });
        })
        this.tilesRef = MatrixUtils.ensureSize(tilesRef, this.size.height, this.size.width, null);
    }

    public getTileRefAt(coordinate: Coordinate): TileRefData | null {
        if (coordinate.col < 0 || coordinate.col >= this.size.width) return null;
        if (coordinate.row < 0 || coordinate.row >= this.size.height) return null;

        const row = this.tilesRef[coordinate.row];
        if (!row) return null;

        const tileRef = row[coordinate.col];
        if (!tileRef) return null;

        const tilesetId = this.tilesetRefManager.getTilesetIdByIndex(tileRef.tilesetIndex);
        if (!tilesetId) return null;

        return { tileId: tileRef.tileId, tilesetId };
    }

    public setTileAt(coordinate: Coordinate, tileId: number, tilesetId: string): Result<TileRefData | null> {
        if (coordinate.col < 0 || coordinate.col >= this.size.width) return Result.Error("Tile not found, col is out of range");
        if (coordinate.row < 0 || coordinate.row >= this.size.height) return Result.Error("Tile not found, row is out of range");

        if (!this.tilesRef[coordinate.row]) this.tilesRef[coordinate.row] = [];
        let tileRef = this.tilesRef[coordinate.row][coordinate.col];

        const tilesetIndex = this.tilesetRefManager.getTilesetIndexById(tilesetId);
        if (tilesetIndex === -1) return Result.Error("Tile not found, tileset not found");
        if (tileRef === null || tileRef === undefined) {
            tileRef = new TileRef(tileId, tilesetIndex);
            this.tilesRef[coordinate.row][coordinate.col] = tileRef;
        }
        const setTileResult = tileRef.setTile(tileId, tilesetIndex);
        this.eventEmitter.emit("tileChanged", coordinate.col, coordinate.row);
        if (!setTileResult) return Result.Success(null);

        const resultTilesetId = this.tilesetRefManager.getTilesetIdByIndex(setTileResult.tilesetIndex);
        if (!resultTilesetId) return Result.Error("Tileset not found");

        return Result.Success({ tileId: setTileResult.tileId, tilesetId: resultTilesetId });
    }

    public removeTileAt(coordinate: Coordinate): Result {
        if (coordinate.col < 0 || coordinate.col >= this.size.width) return Result.Error("Tile not found, col is out of range");
        if (coordinate.row < 0 || coordinate.row >= this.size.height) return Result.Error("Tile not found, row is out of range");

        if (!this.tilesRef[coordinate.row]) this.tilesRef[coordinate.row] = [];

        this.tilesRef[coordinate.row][coordinate.col] = null;
        this.eventEmitter.emit("tileChanged", coordinate.col, coordinate.row);

        return Result.Success();
    }

    public override serialize(): TileLayerData {
        const layerData = this.tilesRef.map(row => row.map(tileRef => {
            if (!tileRef) return "0";
            return tileRef.serialize();
        }).join(",")).join("\n");

        return {
            id: this.id,
            parentId: this.parentLayer.id,
            type: "tile",
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
            layerData: layerData,
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
    private _tileId: number;
    public get tileId(): number { return this._tileId; }
    private set tileId(value: number) { this._tileId = value; }

    private _tilesetIndex: number;
    public get tilesetIndex(): number { return this._tilesetIndex; }
    private set tilesetIndex(value: number) { this._tilesetIndex = value; }

    constructor(tileId: number, tilesetIndex: number) {
        this.tileId = tileId;
        this.tilesetIndex = tilesetIndex;

    }

    public serialize(): string {
        return `${this.tileId}:${this.tilesetIndex}`;
    }
    
    public setTile(tileId: number, tilesetIndex: number): { tileId: number, tilesetIndex: number } {
        const preTileRefData = { tileId: this.tileId, tilesetIndex: this.tilesetIndex }
        this.tileId = tileId;
        this.tilesetIndex = tilesetIndex;
        return preTileRefData;
    }
}