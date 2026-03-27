import { Point } from "pixi.js";
import { v4 as uuidv4 } from "uuid";

import { TilesetRefManager } from "@/core/manager/tilesetRefManager";
import { TileLayerData, TileRefData } from "@/shared/schema/layerSchema";
import {  Result } from "@/shared/types/result";
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

        const tilesRef = tileLayerData.tilesData.map((tileRefRow) => {
            return tileRefRow.map((tileRef) => {
                if (tileRef === null) return null;
                return new TileRef(tileRef);
            });
        });
        this.tilesRef = MatrixUtils.ensureSize(tilesRef, this.size.height, this.size.width, null);
    }

    public getTileAt(coordinate: Coordinate): TileRef | null {
        if (coordinate.col < 0 || coordinate.col >= this.size.width) return null;
        if (coordinate.row < 0 || coordinate.row >= this.size.height) return null;

        const row = this.tilesRef[coordinate.row];
        if (!row) return null;

        const tileRef = row[coordinate.col];
        if (tileRef === undefined) return null;

        return tileRef;
    }

    public setTileAt(coordinate: Coordinate, tileId: number, tilesetId: string ): Result<TileRefData | null>;
    public setTileAt(coordinate: Coordinate, tileId: number, tilesetIndex: number ): Result<TileRefData | null>;
    public setTileAt(coordinate: Coordinate, tileId: number, tileset: string | number ): Result<TileRefData | null> {
        if (coordinate.col < 0 || coordinate.col >= this.size.width) return Result.Error("Tile not found, col is out of range");
        if (coordinate.row < 0 || coordinate.row >= this.size.height) return Result.Error("Tile not found, row is out of range");

        if (!this.tilesRef[coordinate.row]) this.tilesRef[coordinate.row] = [];
        let tileRef = this.tilesRef[coordinate.row][coordinate.col];

        let setTileResult: TileRefData | null;
        if (typeof tileset === "string") {
            const tilesetId = tileset;
            const tilesetIndex = this.tilesetRefManager.getTilesetIndexById(tilesetId);
            if (tilesetIndex === -1) return Result.Error("Tile not found, tileset not found");
            if (tileRef === null || tileRef === undefined) {
                tileRef = new TileRef({ tileId, tilesetIndex });
                this.tilesRef[coordinate.row][coordinate.col] = tileRef;
            }
            setTileResult = tileRef.setTile({ tileId, tilesetIndex });
        } else {
            const tilesetIndex = tileset;
            if (tileRef === null || tileRef === undefined) {
                tileRef = new TileRef({ tileId, tilesetIndex });
                this.tilesRef[coordinate.row][coordinate.col] = tileRef;
            }
            setTileResult = tileRef.setTile({ tileId, tilesetIndex });
        }
        this.eventEmitter.emit("tileChanged", coordinate.col, coordinate.row);
        return Result.Success(setTileResult)
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
        const allNull = this.tilesRef.every((row) => { return row.every((tileRef) => { return tileRef === null }) });
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
            tilesData: allNull ? [] : this.tilesRef.map((tileRefRow) => tileRefRow.map(tileRef => tileRef ? tileRef.serialize() : null)),
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
    public setTile(newTileRefData: TileRefData): TileRefData {
        const preTileRefData: TileRefData = { tileId: this.tileId, tilesetIndex: this.tilesetIndex }
        this.tileId = newTileRefData.tileId;
        this.tilesetIndex = newTileRefData.tilesetIndex;
        return preTileRefData;

    }

    public getTile(): TileRefData {
        return {
            tileId: this.tileId,
            tilesetIndex: this.tilesetIndex,
        }
    }
}