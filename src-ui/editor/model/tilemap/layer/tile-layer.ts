import { v4 as uuidv4 } from "uuid";

import { TileLayerData, TileRefData } from "@/shared/data-types/layer.data";
import { Result } from "@/shared/types/result";
import { MatrixUtils } from "@/shared/utils/maxtrix.utils";

import { BaseLayer, BaseLayerEvents, IGroupLayer } from "./base-layer";
import { Point2DProperty } from "@/editor/properties/properties.decorator";
import { Tilemap } from "../tilemap";
import type { PropertyUpdateMeta } from "../../base-object";
import { validate } from "@/shared/utils/validate.utils";

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

    @Point2DProperty<TileLayer>({
        label: "property.common.size",
        group: "property.group.properties",
        order: 4,
        readonly: true,
        pointLabel: { x: "property.axis.width", y: "property.axis.height" },
        get: (target) => ({ x: target.size.width, y: target.size.height }),
    })
    public size: { width: number, height: number } = { width: 0, height: 0 }

    @Point2DProperty<TileLayer>({
        label: "property.common.coordinate",
        group: "property.group.properties",
        order: 5,
        readonly: true,
        pointLabel: { x: "property.axis.column", y: "property.axis.row" },
        get: (target) => ({ x: target.offset.x, y: target.offset.y }),
    })
    public coordinate: Coordinate = { col: 0, row: 0 };

    @Point2DProperty<TileLayer>({
        label: "property.common.offset",
        group: "property.group.properties",
        order: 6,
        readonly: true,
        set: (target, value, meta) => target.updateOffset(value.x, value.y, meta),
        get: (target) => ({ x: target.offset.x, y: target.offset.y }),
    })
    public offset: Point2D = { x: 0, y: 0 };

    constructor(
        tileLayerData: TileLayerData,
        parentLayer: IGroupLayer,
        tilemap: Tilemap,
        objectIdScope: string = parentLayer.objectIdScope
    ) {
        const data = validate.requiredObject({ value: tileLayerData, field: "tile layer" });
        super(validate.requiredString({ value: data.id, field: "tile layer.id" }), tilemap, objectIdScope, "Tile Layer");

        this.parentLayer = parentLayer;

        this.name = validate.string({ value: data.name, defaultValue: "Unknow Tile Layer" });

        this.coordinate.col = validate.number({ value: data.x, defaultValue: 0, integer: true });
        this.coordinate.row = validate.number({ value: data.y, defaultValue: 0, integer: true });
        this.offset.x = validate.number({ value: data.offsetx, defaultValue: 0 });
        this.offset.y = validate.number({ value: data.offsety, defaultValue: 0 });

        this.size.width = validate.number({ value: data.width, defaultValue: 1, min: 1, integer: true });
        this.size.height = validate.number({ value: data.height, defaultValue: 1, min: 1, integer: true });

        this.opacity = validate.number({ value: data.opacity, defaultValue: 1, min: 0, max: 1 });
        this.visible = validate.boolean({ value: data.visible, defaultValue: true });
        this.locked = validate.boolean({ value: data.locked, defaultValue: false });

        const layerData = validate.string({ value: data.layerData, defaultValue: "" });
        const tilesRef = layerData.split("\n").map((tileRow) => {
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

        const tilesetId = this.tilesetRefManager.getTilesetRefId(tileRef.tilesetIndex);
        if (!tilesetId) return null;

        return { tileId: tileRef.tileId, tilesetId };
    }

    /**
     * Set tiles at the given coordinates and return the previous tileRefsData.
     * @param payload 
     * @returns previous tileRefsData
     */
    public setTilesAt(payload: SetTilesData[]): Result<SetTilesData[]> {
        if (this.locked || !this.visible) return Result.Cancel();
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

                const tilesetIndex = this.tilesetRefManager.getTilesetRefIndex(tilesetId);
                if (tilesetIndex === -1) return null

                tileRef = new TileRef(tileId, tilesetIndex);
                this.tilesRef[coordinate.row][coordinate.col] = tileRef;

                return { coordinate, tileId: null, tilesetId: null };
            }

            if (isRemove) {
                const oldTilesetId = this.tilesetRefManager.getTilesetRefId(tileRef.tilesetIndex);
                if (!oldTilesetId) return null

                this.tilesRef[coordinate.row][coordinate.col] = null;
                return { coordinate, tileId: tileRef.tileId, tilesetId: oldTilesetId };
            }

            // Not empty to not empty
            const newTilesetIndex = this.tilesetRefManager.getTilesetRefIndex(tilesetId);
            if (newTilesetIndex === -1) return null

            const setTileRefResult = tileRef.setTile(tileId, newTilesetIndex);

            const oldTilesetId = this.tilesetRefManager.getTilesetRefId(setTileRefResult.tilesetIndex);

            return { coordinate, tileId: setTileRefResult.tileId, tilesetId: oldTilesetId || null };
        }).filter(r => r !== null) as SetTilesData[];

        if (result.length === 0) return Result.Cancel("No tile changed");

        this.eventEmitter.emit("tilesChanged", result.map(r => r.coordinate));
        return Result.Success(result);
    }

    public updateOffset(x: number, y: number, meta?: PropertyUpdateMeta): void {
        this.offset.x = x;
        this.offset.y = y;
        this.emitUpdateProperty("offset", this.offset, {
            origin: meta?.origin ?? "external",
            source: meta?.source ?? "TileLayer.updateOffset",
        });
    }

    public override serialize(): TileLayerData {
        const layerData = this.tilesRef.map(row => row.map(tileRef => {
            if (!tileRef) return "0";
            return tileRef.serialize();
        }).join(",")).join("\n");

        return {
            id: this.id,
            type: "tile",
            name: this.name,
            x: this.coordinate.col,
            y: this.coordinate.row,
            width: this.size.width,
            height: this.size.height,
            opacity: this.opacity,
            visible: this._visible,
            locked: this._locked,
            offsetx: this.offset.x,
            offsety: this.offset.y,
            layerData: layerData,
        }
    }

    public override clone(): TileLayer {
        const layerData = this.serialize();
        layerData.id = uuidv4();
        return new TileLayer(layerData, this.parentLayer, this.tilemap, this.objectIdScope);
    }

    public override traverse(cb: (layer: BaseLayer<any>) => void): void {
        cb(this);
    }

    public override removeTilesetRef(tilesetIndex: number): void {
        const changedCoords: Coordinate[] = [];

        this.tilesRef.forEach((row, rowIndex) => {
            if (!row) return;
            row.forEach((tileRef, colIndex) => {
                if (tileRef?.tilesetIndex === tilesetIndex) {
                    this.tilesRef[rowIndex][colIndex] = null;
                    changedCoords.push({ col: colIndex, row: rowIndex });
                }
            });
        });

        if (changedCoords.length > 0) this.eventEmitter.emit("tilesChanged", changedCoords);
    }
}

export class TileRef {
    public tileId: number;
    public tilesetIndex: number;

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
