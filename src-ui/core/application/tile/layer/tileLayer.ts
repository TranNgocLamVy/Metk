import { Point } from "pixi.js";
import { v4 as uuidv4 } from "uuid";

import { TilesetRefManager } from "@/core/manager/tilesetRefManager";
import { TileLayerData, TileRefData } from "@/shared/schema/layerSchema";
import { Result } from "@/shared/types/result";
import { MatrixUtils } from "@/shared/utils/maxtrixUtils";

import { BaseLayer, BaseLayerEvents, IGroupLayer, TilemapProps } from "./baseLayer";
import { RulesetRefManager } from "@/core/manager/rulesetRefManager";

interface TileLayerEvents extends BaseLayerEvents {
    tilesChanged: (coords: Coordinate[]) => void
}

export type SetTilesData = {
    coordinate: Coordinate;
    tileId: number | null;
    tilesetId: string | null;
}

export class TileLayer extends BaseLayer<TileLayerEvents> {
    public tilesRef: (TileRef | null)[][] = [];
    public coordinate: Coordinate = { col: 0, row: 0 };
    public offset: Point = new Point(0, 0);
    public size: { width: number, height: number } = { width: 0, height: 0 }


    constructor(tileLayerData: TileLayerData, parentLayer: IGroupLayer, tilesetRefManager: TilesetRefManager, rulesetRefManager: RulesetRefManager, tilemapProps: TilemapProps) {
        super(tileLayerData.id, tilesetRefManager, rulesetRefManager, tilemapProps);

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

    /**
     * 
     * @param payload 
     * @returns previous tileRefsData
     */
    public setTilesAt(payload: SetTilesData[]): Result<SetTilesData[]> {
        const result = payload.map((data) => {
            const coordinate = data.coordinate;
            const tileId = data.tileId;
            const tilesetId = data.tilesetId;

            if (coordinate.col < 0 || coordinate.col >= this.size.width) return null
            if (coordinate.row < 0 || coordinate.row >= this.size.height) return null

            if (!this.tilesRef[coordinate.row]) this.tilesRef[coordinate.row] = [];
            let tileRef = this.tilesRef[coordinate.row][coordinate.col];

            const isRemove = tileId === null || tilesetId === null;

            if (!tileRef) {
                if (isRemove) return null;

                const tilesetIndex = this.tilesetRefManager.getTilesetIndexById(tilesetId);
                if (tilesetIndex === -1) return null

                tileRef = new TileRef(tileId, tilesetIndex);
                this.tilesRef[coordinate.row][coordinate.col] = tileRef;

                return { coordinate, tileId: null, tilesetId: null };
            }

            if (isRemove) {
                const oldTilesetId = this.tilesetRefManager.getTilesetIdByIndex(tileRef.tilesetIndex);
                if (!oldTilesetId) return null

                this.tilesRef[coordinate.row][coordinate.col] = null;
                return { coordinate, tileId: tileRef.tileId, tilesetId: oldTilesetId };
            }

            // Not empty to not empty
            const newTilesetIndex = this.tilesetRefManager.getTilesetIndexById(tilesetId);
            if (newTilesetIndex === -1) return null

            const setTileRefResult = tileRef.setTile(tileId, newTilesetIndex);

            const oldTilesetId = this.tilesetRefManager.getTilesetIdByIndex(setTileRefResult.tilesetIndex);

            return { coordinate, tileId: setTileRefResult.tileId, tilesetId: oldTilesetId || null };
        }).filter(r => r !== null) as SetTilesData[];

        if (result.length === 0) return Result.Cancel("No tile changed");

        this.eventEmitter.emit("tilesChanged", result.map(r => r.coordinate));
        return Result.Success(result);
    }

    public override posToCoord(pos: Position): Coordinate {
        switch (this.tilemapProps.orientation) {
            case "orthogonal":
                const col = Math.floor((pos.x - this.offset.x) / this.tilemapProps.tileWidth) - this.coordinate.col;
                const row = Math.floor((pos.y - this.offset.y) / this.tilemapProps.tileHeight) - this.coordinate.row;
                return { col, row };
            case "isometric":
                // TODO: Implement isometric
                return { col: 0, row: 0 };
            case "oblique":
                // TODO: Implement oblique
                return { col: 0, row: 0 };
            case "staggered":
                // TODO: Implement staggered
                return { col: 0, row: 0 };
            case "hexagonal":
                // TODO: Implement hexagonal
                return { col: 0, row: 0 };
        }
    }

    public override coordToPos(coord: Coordinate): Position {
        switch (this.tilemapProps.orientation) {
            case "orthogonal":
                const x = (coord.col + this.coordinate.col) * this.tilemapProps.tileWidth + this.offset.x;
                const y = (coord.row + this.coordinate.row) * this.tilemapProps.tileHeight + this.offset.y;
                return { x, y };
            case "isometric":
                // TODO: Implement isometric
                return { x: 0, y: 0 };
            case "oblique":
                // TODO: Implement oblique
                return { x: 0, y: 0 };
            case "staggered":
                // TODO: Implement staggered
                return { x: 0, y: 0 };
            case "hexagonal":
                // TODO: Implement hexagonal
                return { x: 0, y: 0 };
        }
    }

    public override posToSnapPos(pos: Position): Position {
        const coord = this.posToCoord(pos);
        return this.coordToPos(coord);
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
        return new TileLayer(layerData, this.parentLayer, this.tilesetRefManager, this.rulesetRefManager, this.tilemapProps);
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